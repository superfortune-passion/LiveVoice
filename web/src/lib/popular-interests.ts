export interface PopularInterest {
  tag: string;
  label: string;
  icon: string;
  subtitle: string;
  /** Visual accent for card glow (CSS custom property) */
  accent: InterestAccent;
}

export type InterestAccent = {
  hue: "cyan" | "magenta" | "pink" | "green" | "amber" | "violet";
};

export const INTEREST_ACCENTS: Record<
  InterestAccent["hue"],
  { ring: string; glow: string; gradient: string }
> = {
  cyan: {
    ring: "rgb(0 229 255 / 0.55)",
    glow: "rgb(0 229 255 / 0.28)",
    gradient:
      "linear-gradient(135deg, rgb(0 229 255 / 0.22), rgb(124 77 255 / 0.12))",
  },
  magenta: {
    ring: "rgb(255 0 194 / 0.55)",
    glow: "rgb(255 0 194 / 0.28)",
    gradient:
      "linear-gradient(135deg, rgb(255 0 194 / 0.22), rgb(255 0 98 / 0.12))",
  },
  pink: {
    ring: "rgb(255 0 98 / 0.55)",
    glow: "rgb(255 0 98 / 0.28)",
    gradient:
      "linear-gradient(135deg, rgb(255 0 98 / 0.2), rgb(255 0 194 / 0.14))",
  },
  green: {
    ring: "rgb(76 175 80 / 0.55)",
    glow: "rgb(76 175 80 / 0.28)",
    gradient:
      "linear-gradient(135deg, rgb(76 175 80 / 0.2), rgb(0 229 255 / 0.1))",
  },
  amber: {
    ring: "rgb(255 193 7 / 0.5)",
    glow: "rgb(255 193 7 / 0.22)",
    gradient:
      "linear-gradient(135deg, rgb(255 193 7 / 0.18), rgb(255 0 194 / 0.1))",
  },
  violet: {
    ring: "rgb(124 77 255 / 0.55)",
    glow: "rgb(124 77 255 / 0.28)",
    gradient:
      "linear-gradient(135deg, rgb(124 77 255 / 0.22), rgb(0 229 255 / 0.1))",
  },
};

export const ALL_POPULAR_INTERESTS: PopularInterest[] = [
  {
    tag: "gaming",
    label: "Gaming",
    icon: "🎮",
    subtitle: "Squads, ranked, & late-night lobbies",
    accent: { hue: "cyan" },
  },
  {
    tag: "music",
    label: "Music",
    icon: "🎵",
    subtitle: "Playlists, artists, & live sets",
    accent: { hue: "magenta" },
  },
  {
    tag: "coding",
    label: "Coding",
    icon: "💻",
    subtitle: "Builders, debug sessions, & stack talk",
    accent: { hue: "violet" },
  },
  {
    tag: "movies",
    label: "Movies",
    icon: "🎬",
    subtitle: "Films, series, & spoiler-free chat",
    accent: { hue: "pink" },
  },
  {
    tag: "travel",
    label: "Travel",
    icon: "🌍",
    subtitle: "Routes, cultures, & travel stories",
    accent: { hue: "green" },
  },
  {
    tag: "sports",
    label: "Sports",
    icon: "⚽",
    subtitle: "Games, teams, & match reactions",
    accent: { hue: "green" },
  },
  {
    tag: "anime",
    label: "Anime",
    icon: "✨",
    subtitle: "Seasons, characters, & recommendations",
    accent: { hue: "pink" },
  },
  {
    tag: "philosophy",
    label: "Philosophy",
    icon: "💭",
    subtitle: "Big questions & thoughtful debate",
    accent: { hue: "violet" },
  },
  {
    tag: "chat",
    label: "Chat",
    icon: "💬",
    subtitle: "Open conversation, any topic",
    accent: { hue: "amber" },
  },
];

/** @deprecated Use ALL_POPULAR_INTERESTS */
export const TRENDING_INTERESTS = ALL_POPULAR_INTERESTS.slice(0, 6);
/** @deprecated Use ALL_POPULAR_INTERESTS */
export const MORE_INTERESTS = ALL_POPULAR_INTERESTS.slice(6);

export const INTEREST_LABELS: Record<string, string> = Object.fromEntries(
  ALL_POPULAR_INTERESTS.map((i) => [i.tag, i.label])
);

export function getInterestByTag(tag: string): PopularInterest | undefined {
  return ALL_POPULAR_INTERESTS.find((i) => i.tag === tag);
}
