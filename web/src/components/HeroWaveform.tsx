"use client";

import { memo } from "react";
import type { AppPhase } from "@/types/app";
import { CanvasWaveform } from "./CanvasWaveform";

interface HeroWaveformProps {
  active?: boolean;
  speaking?: boolean;
  calm?: boolean;
  stream?: MediaStream | null;
  demoPhase?: AppPhase;
  barCount?: number;
  className?: string;
}

export const HeroWaveform = memo(function HeroWaveform({
  active = true,
  speaking = false,
  calm = false,
  stream = null,
  demoPhase,
  barCount = 40,
  className = "",
}: HeroWaveformProps) {
  const hasStream = Boolean(stream?.getAudioTracks().length);
  const intensity = calm ? 0.5 : speaking ? 1.65 : 1.1;

  return (
    <div className={`relative w-full ${className}`} aria-hidden>
      <div className="waveform-glow pointer-events-none absolute inset-0 rounded-3xl" />
      <CanvasWaveform
        stream={hasStream ? stream : null}
        demo={active && !hasStream}
        demoIntensity={intensity}
        demoPhase={demoPhase}
        barCount={barCount}
        variant="neutral"
        height={112}
      />
    </div>
  );
});
