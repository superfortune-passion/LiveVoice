/**
 * In-memory sliding-window rate limiter per socket id.
 * Resets on process restart; suitable for single-instance MVP.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();

  /**
   * @returns true if allowed, false if rate limited
   */
  consume(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;
    return bucket.count <= limit;
  }

  /** Remove stale bucket entries periodically */
  prune(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt + 60_000) {
        this.buckets.delete(key);
      }
    }
  }
}

export const searchLimiter = new RateLimiter();
export const skipLimiter = new RateLimiter();
export const reportLimiter = new RateLimiter();

export const LIMITS = {
  START_SEARCH: { limit: 12, windowMs: 60_000 },
  SKIP: { limit: 30, windowMs: 60_000 },
  REPORT: { limit: 5, windowMs: 300_000 },
} as const;
