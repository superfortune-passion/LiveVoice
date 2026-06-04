import { loadServerEnv } from "./load-env.js";

loadServerEnv();

import cors from "cors";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  createExpressCorsOptions,
  createSocketIoCorsOptions,
  isAllowAllOrigins,
  parseClientOrigins,
} from "./cors.js";
import { MatchmakingQueue } from "./matchmaking.js";
import { interestMatchScore } from "./matchmaking.js";
import { sanitizeInterests } from "./sanitize.js";
import { LIMITS, reportLimiter, searchLimiter, skipLimiter } from "./rateLimit.js";
import { ConnectionRegistry } from "./connection-registry.js";
import { jamRelayStub } from "./jam-relay-stub.js";
import { broadcastPlatformStats, getPlatformStats } from "./stats.js";
import type {
  IceCandidatePayload,
  PeerDisconnectedPayload,
  ReportPayload,
  SdpPayload,
  StartSearchPayload,
} from "./types.js";

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const STALE_QUEUE_MS = Number(process.env.STALE_QUEUE_MS) || 10 * 60 * 1000;
const PRUNE_INTERVAL_MS = 60_000;

const allowedOrigins = parseClientOrigins();

const app = express();
app.use(cors(createExpressCorsOptions()));

const matchmaking = new MatchmakingQueue(STALE_QUEUE_MS);
const connectionRegistry = new ConnectionRegistry();
const userInterests = new Map<string, string[]>();
let reportCount = 0;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: createSocketIoCorsOptions(),
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 20000,
});

function refreshStats(): void {
  broadcastPlatformStats(io, matchmaking);
}

/** Fast liveness check — use this in the browser (no heavy audit). */
app.get("/health", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, ...getPlatformStats(io, matchmaking) });
});

app.get("/health/details", (_req: Request, res: Response) => {
  const audit = connectionRegistry.auditPairs(matchmaking);
  res.json({
    ok: true,
    ...getPlatformStats(io, matchmaking),
    registry: connectionRegistry.snapshot(matchmaking),
    jamRelay: jamRelayStub.getStats(),
    pairAuditOrphans: audit.orphans,
    reports: reportCount,
    cors: isAllowAllOrigins()
      ? "all"
      : allowedOrigins,
    allowVercelPreviews: process.env.ALLOW_VERCEL_PREVIEWS === "true",
  });
});

function emitToPeer(socketId: string, event: string, payload: unknown): void {
  io.to(socketId).emit(event, payload);
}

function notifyPeerDisconnected(
  peerId: string,
  payload: PeerDisconnectedPayload
): void {
  emitToPeer(peerId, "peer-disconnected", payload);
}

function emitRateLimited(socketId: string, action: string): void {
  emitToPeer(socketId, "rate-limited", {
    action,
    message: `Too many ${action} requests. Please wait a moment.`,
  });
}

function sharedBetween(socketA: string, socketB: string): string[] {
  const a = userInterests.get(socketA) ?? [];
  const b = userInterests.get(socketB) ?? [];
  if (interestMatchScore(a, b) === 0) return [];
  const setB = new Set(b);
  return a.filter((t) => setB.has(t));
}

function emitMatched(socketId: string, peerId: string): void {
  const sharedInterests = sharedBetween(socketId, peerId);
  emitToPeer(socketId, "matched", {
    peerId,
    isInitiator: matchmaking.isInitiator(socketId, peerId),
    sharedInterests,
  });
  emitToPeer(peerId, "matched", {
    peerId: socketId,
    isInitiator: matchmaking.isInitiator(peerId, socketId),
    sharedInterests,
  });
  refreshStats();
}

function tryMatchSocket(
  socket: import("socket.io").Socket,
  interests: string[]
): void {
  const peerId = matchmaking.tryMatch(socket.id, interests);
  if (peerId) {
    emitMatched(socket.id, peerId);
  } else {
    refreshStats();
  }
}

setInterval(() => {
  const removed = matchmaking.pruneStaleWaiters();
  searchLimiter.prune();
  skipLimiter.prune();
  reportLimiter.prune();
  if (removed > 0) {
    console.log(`[queue] pruned ${removed} stale waiter(s)`);
    refreshStats();
  }
  const audit = connectionRegistry.auditPairs(matchmaking);
  if (audit.orphans > 0) {
    console.warn(`[registry] cleared ${audit.orphans} orphan pair reference(s)`);
  }
}, PRUNE_INTERVAL_MS);

io.on("connection", (socket) => {
  connectionRegistry.trackConnect(socket.id);
  console.log(`[connect] ${socket.id}`);
  socket.emit("platform-stats", getPlatformStats(io, matchmaking));
  refreshStats();

  socket.on("start-search", (data?: StartSearchPayload) => {
    const { limit, windowMs } = LIMITS.START_SEARCH;
    if (!searchLimiter.consume(socket.id, limit, windowMs)) {
      emitRateLimited(socket.id, "start-search");
      return;
    }

    const interests = sanitizeInterests(data?.interests);
    userInterests.set(socket.id, interests);

    if (matchmaking.isPaired(socket.id)) {
      const peer = matchmaking.unpair(socket.id);
      if (peer) {
        notifyPeerDisconnected(peer, {
          reason: "skip",
          message: "Your partner started a new search.",
        });
      }
    } else {
      matchmaking.removeFromQueue(socket.id);
    }

    socket.emit("searching");
    tryMatchSocket(socket, interests);
    refreshStats();
  });

  socket.on("stop-search", () => {
    matchmaking.removeFromQueue(socket.id);
    const peer = matchmaking.unpair(socket.id);
    if (peer) {
      notifyPeerDisconnected(peer, {
        reason: "disconnect",
        message: "Your partner ended the session.",
      });
    }
    socket.emit("session-ended");
    refreshStats();
  });

  socket.on("skip", () => {
    const { limit, windowMs } = LIMITS.SKIP;
    if (!skipLimiter.consume(socket.id, limit, windowMs)) {
      emitRateLimited(socket.id, "skip");
      return;
    }

    const peer = matchmaking.unpair(socket.id);
    if (peer) {
      notifyPeerDisconnected(peer, {
        reason: "skip",
        message: "Your partner skipped to someone else.",
      });
    }

    socket.emit("searching");
    const interests = userInterests.get(socket.id) ?? [];
    tryMatchSocket(socket, interests);
    refreshStats();
  });

  socket.on("report", (payload: ReportPayload) => {
    const { limit, windowMs } = LIMITS.REPORT;
    if (!reportLimiter.consume(socket.id, limit, windowMs)) {
      emitRateLimited(socket.id, "report");
      return;
    }

    reportCount += 1;
    const peer = matchmaking.getPeer(socket.id);
    console.log(
      `[report] #${reportCount} reason=${payload.reason} reporter=${socket.id.slice(0, 8)} peer=${peer?.slice(0, 8) ?? "none"}`
    );
    socket.emit("report-received", {
      message: "Thank you. Report logged. You can skip or end the session.",
    });
  });

  socket.on("offer", (payload: Omit<SdpPayload, "from">) => {
    const peer = matchmaking.getPeer(socket.id);
    if (peer) emitToPeer(peer, "offer", { ...payload, from: socket.id });
  });

  socket.on("answer", (payload: Omit<SdpPayload, "from">) => {
    const peer = matchmaking.getPeer(socket.id);
    if (peer) emitToPeer(peer, "answer", { ...payload, from: socket.id });
  });

  socket.on("ice-candidate", (payload: Omit<IceCandidatePayload, "from">) => {
    const peer = matchmaking.getPeer(socket.id);
    if (peer) emitToPeer(peer, "ice-candidate", { ...payload, from: socket.id });
  });

  socket.on("disconnect", (reason) => {
    connectionRegistry.trackDisconnect(socket.id);
    console.log(`[disconnect] ${socket.id} (${reason})`);
    userInterests.delete(socket.id);
    const peer = matchmaking.purgeSocket(socket.id);
    if (peer) {
      notifyPeerDisconnected(peer, {
        reason: "disconnect",
        message: "Your partner disconnected.",
      });
    }
    refreshStats();
  });
});

httpServer.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[server] Port ${PORT} is already in use. From repo root run: npm run stop`
    );
    process.exit(1);
  }
  throw err;
});

httpServer.listen(PORT, HOST, () => {
  console.log(`VoiceLink signaling server on http://${HOST}:${PORT}`);
  console.log(
    `CORS: ${isAllowAllOrigins() ? "all origins (*)" : (allowedOrigins as string[]).join(", ")}`
  );
  console.log(`Socket.io accepts connections from any page origin when CORS is (*)`);
});
