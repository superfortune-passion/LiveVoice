import type { Server } from "socket.io";
import type { MatchmakingQueue } from "./matchmaking.js";

export interface PlatformStatsPayload {
  online: number;
  waiting: number;
  inCall: number;
}

export function getPlatformStats(
  io: Server,
  matchmaking: MatchmakingQueue
): PlatformStatsPayload {
  return {
    online: io.engine.clientsCount,
    waiting: matchmaking.waitingCount,
    inCall: matchmaking.activePairs,
  };
}

export function broadcastPlatformStats(
  io: Server,
  matchmaking: MatchmakingQueue
): void {
  io.emit("platform-stats", getPlatformStats(io, matchmaking));
}
