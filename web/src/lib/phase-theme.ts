import type { AppPhase } from "@/types/app";

export interface PhaseTheme {
  orb: string;
  ring: string;
  glow: string;
  accent: string;
  badge: string;
  label: string;
}

/** Status + brand palette — high contrast on #0D0F17 */
export const colors = {
  bg: "#0D0F17",
  text: "#FFFFFF",
  textSecondary: "#B0B8C8",
  ctaStart: "#00E5FF",
  ctaMid: "#FF00C2",
  ctaEnd: "#FF0062",
  success: "#4CAF50",
  error: "#E53935",
  warning: "#FFC107",
} as const;

export const phaseThemes: Record<AppPhase, PhaseTheme> = {
  idle: {
    orb: "from-[#00E5FF]/50 via-[#FF00C2]/40 to-[#FF0062]/45",
    ring: "border-[#00E5FF]/50",
    glow: "orb-glow-brand",
    accent: "text-white",
    badge: "badge-brand",
    label: "Ready",
  },
  mic_permission: {
    orb: "from-[#FFC107]/45 via-[#FF00C2]/25 to-[#FF0062]/30",
    ring: "border-[#FFC107]/55",
    glow: "orb-glow-warning",
    accent: "text-[#FFC107]",
    badge: "badge-warning",
    label: "Permission",
  },
  searching: {
    orb: "from-[#FF00C2]/55 via-[#00E5FF]/40 to-[#FF0062]/50",
    ring: "border-[#FF00C2]/55",
    glow: "orb-glow-search",
    accent: "text-[#FF00C2]",
    badge: "badge-brand",
    label: "Searching",
  },
  connecting: {
    orb: "from-[#00E5FF]/50 via-[#FF00C2]/45 to-[#FF0062]/40",
    ring: "border-[#00E5FF]/55",
    glow: "orb-glow-brand",
    accent: "text-[#00E5FF]",
    badge: "badge-brand",
    label: "Connecting",
  },
  connected: {
    orb: "from-[#4CAF50]/50 via-[#00E5FF]/35 to-[#4CAF50]/45",
    ring: "border-[#4CAF50]/60",
    glow: "orb-glow-success",
    accent: "text-[#4CAF50]",
    badge: "badge-success",
    label: "Live",
  },
  peer_disconnected: {
    orb: "from-[#FFC107]/40 via-[#FF0062]/25 to-[#E53935]/30",
    ring: "border-[#FFC107]/50",
    glow: "orb-glow-warning",
    accent: "text-[#FFC107]",
    badge: "badge-warning",
    label: "Reconnecting",
  },
  error: {
    orb: "from-[#E53935]/50 via-[#FF0062]/30 to-[#E53935]/40",
    ring: "border-[#E53935]/55",
    glow: "orb-glow-error",
    accent: "text-[#E53935]",
    badge: "badge-error",
    label: "Error",
  },
};

export function averageLevel(levels: number[]): number {
  if (levels.length === 0) return 0.12;
  return levels.reduce((a, b) => a + b, 0) / levels.length;
}
