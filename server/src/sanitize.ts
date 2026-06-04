/** Server-side interest tag sanitization (no PII). */

const MAX_TAGS = 10;
const MIN_TAG_LEN = 2;
const MAX_TAG_LEN = 32;

const BLOCKED_SUBSTRINGS = [
  "http",
  "www.",
  "<",
  ">",
  "script",
  "javascript",
  "onerror",
  "onclick",
];

/** Letters, numbers, spaces, hyphen, underscore (Unicode letters). */
const TAG_PATTERN = /^[\p{L}\p{N}\s\-_]+$/u;

export function sanitizeInterestTag(raw: string): string | null {
  const tag = raw.trim().toLowerCase().slice(0, MAX_TAG_LEN);
  if (tag.length < MIN_TAG_LEN) return null;
  if (!TAG_PATTERN.test(tag)) return null;
  const lower = tag.toLowerCase();
  if (BLOCKED_SUBSTRINGS.some((b) => lower.includes(b))) return null;
  return tag;
}

export function sanitizeInterests(raw: string[] | undefined): string[] {
  if (!raw?.length) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    const tag = sanitizeInterestTag(item);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
      if (result.length >= MAX_TAGS) break;
    }
  }
  return result;
}

/** @deprecated Use sanitizeInterests — kept for matchmaking import compat */
export function normalizeInterests(raw: string[] | undefined): string[] {
  return sanitizeInterests(raw);
}
