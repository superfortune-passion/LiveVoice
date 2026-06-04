"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useOrbEnergy } from "@/hooks/useOrbEnergy";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { phaseThemes } from "@/lib/phase-theme";
import type { AppPhase } from "@/types/app";

interface VoiceOrbProps {
  phase: AppPhase;
  stream?: MediaStream | null;
  speaking?: boolean;
  demo?: boolean;
  size?: "hero" | "call" | "compact";
  className?: string;
}

const sizeMap = {
  hero: "h-[min(72vw,340px)] w-[min(72vw,340px)]",
  call: "h-[min(56vw,280px)] w-[min(56vw,280px)]",
  compact: "h-40 w-40 sm:h-48 sm:w-48",
};

export const VoiceOrb = memo(function VoiceOrb({
  phase,
  stream = null,
  speaking = false,
  demo = false,
  size = "hero",
  className = "",
}: VoiceOrbProps) {
  const reducedMotion = useReducedMotion();
  const theme = phaseThemes[phase];
  const energyRef = useOrbEnergy(stream, phase, demo || !stream);

  const ringCount =
    phase === "searching" ? 3 : phase === "connecting" ? 2 : speaking ? 2 : 1;

  const pulseActive =
    !reducedMotion &&
    (phase === "searching" ||
      phase === "connecting" ||
      phase === "connected" ||
      speaking);

  const fastPulse = phase === "searching";

  return (
    <div
      ref={energyRef}
      className={`orb-energy-root relative flex items-center justify-center ${sizeMap[size]} ${className}`}
      aria-hidden
    >
      <div className={`orb-back-glow absolute inset-[5%] rounded-full ${theme.glow}`} />

      {Array.from({ length: ringCount }).map((_, i) => (
        <div
          key={i}
          className={`orb-ring absolute inset-0 rounded-full border-2 ${theme.ring} ${
            pulseActive ? (fastPulse ? "orb-ring-pulse-fast" : "orb-ring-pulse") : ""
          }`}
          style={{ margin: `${(i + 1) * 12}%`, animationDelay: `${i * 0.35}s` }}
        />
      ))}

      <motion.div
        className={`orb-core relative z-10 rounded-full bg-gradient-to-br ${theme.orb} ${
          pulseActive ? (fastPulse ? "orb-breathe-fast" : "orb-breathe") : ""
        }`}
        style={{ width: "72%", height: "72%" }}
        animate={
          reducedMotion || !speaking
            ? undefined
            : { scale: [1, 1.06, 1] }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <div className="orb-shine absolute inset-0 rounded-full" />
        <div className="orb-inner-glow absolute inset-[10%] rounded-full" />
        <div className="orb-depth-ring absolute inset-[4%] rounded-full border border-white/20" />
      </motion.div>

      {!reducedMotion && (
        <div className="orb-spin absolute inset-[6%] z-20 rounded-full" aria-hidden />
      )}
    </div>
  );
});
