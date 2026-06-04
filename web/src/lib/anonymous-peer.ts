/**
 * Deterministic anonymous display names from ephemeral socket ids.
 * No PII — same peer id always maps to the same label within a session.
 */

const MUSICIAN_PREFIXES = [
  "Vocalist",
  "Guitarist",
  "Pianist",
  "Producer",
  "Drummer",
  "Composer",
  "Singer",
  "Beatmaker",
] as const;

const MUSICIAN_SUFFIXES = [
  "in the mix",
  "on the line",
  "live",
  "tuning up",
  "on air",
] as const;

function hashPeerId(peerId: string): number {
  let h = 0;
  for (let i = 0; i < peerId.length; i++) {
    h = (h * 31 + peerId.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** e.g. "Guitarist #A3F2" */
export function anonymousPeerLabel(peerId: string | null | undefined): string {
  if (!peerId) return "Fellow musician";
  const h = hashPeerId(peerId);
  const prefix = MUSICIAN_PREFIXES[h % MUSICIAN_PREFIXES.length] ?? "Musician";
  const suffix =
    MUSICIAN_SUFFIXES[(h >> 8) % MUSICIAN_SUFFIXES.length] ?? "on air";
  const short =
    peerId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "????";
  return `${prefix} #${short} - ${suffix}`;
}
