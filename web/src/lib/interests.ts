import { sanitizeInterestTag } from "@/lib/sanitize";

/** Toggle tag in list with sanitization and deduplication. */
export function toggleInterest(
  selected: string[],
  rawTag: string
): string[] {
  const tag = sanitizeInterestTag(rawTag);
  if (!tag) return selected;
  if (selected.includes(tag)) {
    return selected.filter((t) => t !== tag);
  }
  if (selected.length >= 10) return selected;
  return [...selected, tag];
}

export function sanitizeInterestList(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = sanitizeInterestTag(raw);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }
  return result;
}
