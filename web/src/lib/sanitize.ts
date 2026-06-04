/** Client-side interest sanitization (mirrors server rules). */

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
];

const TAG_PATTERN = /^[\p{L}\p{N}\s\-_]+$/u;

export function sanitizeInterestTag(raw: string): string | null {
  const tag = raw.trim().toLowerCase().slice(0, MAX_TAG_LEN);
  if (tag.length < MIN_TAG_LEN) return null;
  if (!TAG_PATTERN.test(tag)) return null;
  if (BLOCKED_SUBSTRINGS.some((b) => tag.includes(b))) return null;
  return tag;
}

export function sanitizeInterestsFromInput(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(/[,#]+/)) {
    const tag = sanitizeInterestTag(part);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
      if (result.length >= MAX_TAGS) break;
    }
  }
  return result;
}
