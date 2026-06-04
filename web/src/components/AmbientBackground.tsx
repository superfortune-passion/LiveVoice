"use client";

import { memo, useMemo } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AmbientBackgroundProps {
  intensity?: "low" | "high";
}

export const AmbientBackground = memo(function AmbientBackground({
  intensity = "low",
}: AmbientBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const particleCount = reducedMotion ? 0 : intensity === "high" ? 14 : 8;

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: (i * 37 + 11) % 100,
        y: (i * 53 + 7) % 100,
        delay: (i % 6) * 0.6,
      })),
    [particleCount]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="premium-mesh absolute inset-0" />
      <div
        className={`aurora-blob aurora-blob-a absolute -left-[20%] top-[8%] h-[50vh] w-[50vh] rounded-full ${
          reducedMotion ? "" : "aurora-drift-a"
        }`}
      />
      <div
        className={`aurora-blob aurora-blob-b absolute -right-[15%] top-[35%] h-[40vh] w-[40vh] rounded-full ${
          reducedMotion ? "" : "aurora-drift-b"
        }`}
      />
      {!reducedMotion &&
        particles.map((p) => (
          <span
            key={p.id}
            className="ambient-particle ambient-float absolute rounded-full bg-white/50 will-change-transform"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: 2,
              height: 2,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
    </div>
  );
});
