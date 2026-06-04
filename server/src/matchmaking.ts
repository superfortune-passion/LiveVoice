import { sanitizeInterests } from "./sanitize.js";
import type { QueuedUser } from "./types.js";

export { sanitizeInterests, sanitizeInterests as normalizeInterests };

export function interestMatchScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  return a.filter((tag) => setB.has(tag)).length;
}

export function findBestMatch(
  incoming: QueuedUser,
  queue: QueuedUser[]
): QueuedUser | null {
  if (queue.length === 0) return null;

  const hasInterests = incoming.interests.length > 0;

  if (hasInterests) {
    const scored = queue
      .map((candidate) => ({
        candidate,
        score: interestMatchScore(incoming.interests, candidate.interests),
      }))
      .filter((entry) => entry.score > 0);

    if (scored.length > 0) {
      const maxScore = Math.max(...scored.map((s) => s.score));
      const topTier = scored.filter((s) => s.score === maxScore);
      return topTier[Math.floor(Math.random() * topTier.length)].candidate;
    }
  }

  return queue[Math.floor(Math.random() * queue.length)];
}

const DEFAULT_STALE_MS = 10 * 60 * 1000;

export class MatchmakingQueue {
  private queue: QueuedUser[] = [];
  private pairs = new Map<string, string>();
  private staleMs: number;

  constructor(staleMs = DEFAULT_STALE_MS) {
    this.staleMs = staleMs;
  }

  get waitingCount(): number {
    return this.queue.length;
  }

  get activePairs(): number {
    return this.pairs.size / 2;
  }

  isInQueue(socketId: string): boolean {
    return this.queue.some((u) => u.socketId === socketId);
  }

  isPaired(socketId: string): boolean {
    return this.pairs.has(socketId);
  }

  getPeer(socketId: string): string | undefined {
    return this.pairs.get(socketId);
  }

  removeFromQueue(socketId: string): void {
    this.queue = this.queue.filter((u) => u.socketId !== socketId);
  }

  /** Drop waiters who exceeded max queue time (tab abandoned, etc.). */
  pruneStaleWaiters(): number {
    const cutoff = Date.now() - this.staleMs;
    const before = this.queue.length;
    this.queue = this.queue.filter((u) => u.joinedAt >= cutoff);
    return before - this.queue.length;
  }

  enqueue(socketId: string, interests: string[]): void {
    this.removeFromQueue(socketId);
    this.queue.push({
      socketId,
      interests,
      joinedAt: Date.now(),
    });
  }

  tryMatch(socketId: string, interests: string[]): string | null {
    if (this.pairs.has(socketId)) {
      return null;
    }

    this.pruneStaleWaiters();

    const incoming: QueuedUser = {
      socketId,
      interests,
      joinedAt: Date.now(),
    };

    this.removeFromQueue(socketId);
    const others = this.queue.filter((u) => u.socketId !== socketId);
    const match = findBestMatch(incoming, others);

    if (!match) {
      this.enqueue(socketId, interests);
      return null;
    }

    this.removeFromQueue(match.socketId);
    this.pairs.set(socketId, match.socketId);
    this.pairs.set(match.socketId, socketId);
    return match.socketId;
  }

  isInitiator(socketId: string, peerId: string): boolean {
    return socketId.localeCompare(peerId) < 0;
  }

  unpair(socketId: string): string | undefined {
    const peer = this.pairs.get(socketId);
    if (peer) {
      this.pairs.delete(socketId);
      this.pairs.delete(peer);
    }
    this.removeFromQueue(socketId);
    return peer;
  }

  handleDisconnect(socketId: string): string | undefined {
    this.removeFromQueue(socketId);
    return this.unpair(socketId);
  }

  /** Full cleanup for a socket (disconnect / reconnect of old session). */
  purgeSocket(socketId: string): string | undefined {
    return this.handleDisconnect(socketId);
  }
}
