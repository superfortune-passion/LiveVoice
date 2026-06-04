import { isPrivateLanHost } from "@/lib/app-environment";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket";

/** Hosts where signaling is reachable at hostname:3001 on the same machine/LAN. */
function usesLocalSignalingPort(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    isPrivateLanHost(hostname)
  );
}

const SOCKET_PATH = "/socket.io";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export type SocketConnectMode = "same-origin" | "direct";

/**
 * Resolves where Socket.io connects.
 *
 * - Explicit `NEXT_PUBLIC_SOCKET_URL` (not `auto`) → that URL.
 * - `auto` + localhost/LAN IP → **direct :3001** on that host.
 * - `auto` + public URL (ngrok, Vercel) → `NEXT_PUBLIC_SOCKET_URL` or `NEXT_PUBLIC_SIGNALING_URL`.
 * - Internet testers (Computer B) must open your **HTTPS tunnel** or deployed URL — not your localhost.
 */
export function resolveSignalingUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (configured && configured !== "auto") {
    return configured.replace(/\/$/, "");
  }

  const signaling = process.env.NEXT_PUBLIC_SIGNALING_URL?.trim();
  if (typeof window === "undefined") {
    return signaling?.replace(/\/$/, "") || null;
  }

  const { hostname, protocol } = window.location;

  if (usesLocalSignalingPort(hostname)) {
    const proto = protocol === "https:" ? "https" : "http";
    return `${proto}://${hostname}:3001`;
  }

  if (signaling) return signaling.replace(/\/$/, "");

  return null;
}

export function getSocketConnectMode(): SocketConnectMode {
  return resolveSignalingUrl() ? "direct" : "same-origin";
}

const sharedOptions = {
  path: SOCKET_PATH,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 15000,
  transports: ["polling", "websocket"] as ("websocket" | "polling")[],
};

function createSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  const url = resolveSignalingUrl();

  if (url) {
    return io(url, {
      ...sharedOptions,
      secure: url.startsWith("https://"),
    });
  }

  return io(sharedOptions);
}

/**
 * Singleton Socket.io client (browser only — never call during SSR).
 */
export function getSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  if (typeof window === "undefined") {
    throw new Error("getSocket() must run in the browser");
  }
  if (!socket) {
    socket = createSocket();
    socket.on("connect_error", (err) => {
      console.warn("[VoiceLink socket]", err.message, resolveSignalingUrl() ?? "same-origin");
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
