/**
 * Tracks active Socket.io connections and matchmaking pairs.
 * Used for health metrics and leak detection (orphan pair entries).
 */

import type { MatchmakingQueue } from "./matchmaking.js";

export class ConnectionRegistry {
  private sockets = new Set<string>();

  trackConnect(socketId: string): void {
    this.sockets.add(socketId);
  }

  trackDisconnect(socketId: string): void {
    this.sockets.delete(socketId);
  }

  getSocketCount(): number {
    return this.sockets.size;
  }

  /**
   * Validates pair map symmetry and logs inconsistencies.
   * @returns number of orphan entries detected this check
   */
  auditPairs(matchmaking: MatchmakingQueue): { orphans: number; pairs: number } {
    const pairs = matchmaking.activePairs;
    let orphans = 0;

    for (const socketId of this.sockets) {
      const peer = matchmaking.getPeer(socketId);
      if (peer && !this.sockets.has(peer)) {
        orphans += 1;
        console.warn(
          `[registry] orphan pair: ${socketId.slice(0, 8)} → missing peer ${peer.slice(0, 8)}`
        );
      }
    }

    return { orphans, pairs };
  }

  snapshot(matchmaking: MatchmakingQueue) {
    return {
      sockets: this.getSocketCount(),
      waiting: matchmaking.waitingCount,
      pairs: matchmaking.activePairs,
    };
  }
}
