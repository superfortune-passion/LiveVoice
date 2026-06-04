"use client";

import { memo } from "react";
import { CanvasWaveform, type WaveformVariant } from "./CanvasWaveform";

interface AudioWaveformProps {
  stream: MediaStream | null;
  label?: string;
  active?: boolean;
  variant?: WaveformVariant;
}

export const AudioWaveform = memo(function AudioWaveform({
  stream,
  label,
  active = true,
  variant = "remote",
}: AudioWaveformProps) {
  const hasStream = active && Boolean(stream?.getAudioTracks().length);

  return (
    <div className="flex w-full flex-col items-center gap-2" aria-hidden={!label}>
      {label && (
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
            variant === "local" ? "text-violet-300/80" : "text-cyan-300/80"
          }`}
        >
          {label}
        </span>
      )}
      <CanvasWaveform
        stream={hasStream ? stream : null}
        demo={!hasStream}
        barCount={24}
        variant={variant}
        height={80}
      />
    </div>
  );
});
