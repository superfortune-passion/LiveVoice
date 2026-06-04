"use client";

import { memo } from "react";
import { AudioWaveform } from "./AudioWaveform";

interface DualVoiceVisualizerProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localSpeaking: boolean;
  remoteSpeaking: boolean;
  isMuted: boolean;
}

export const DualVoiceVisualizer = memo(function DualVoiceVisualizer({
  localStream,
  remoteStream,
  localSpeaking,
  remoteSpeaking,
  isMuted,
}: DualVoiceVisualizerProps) {
  return (
    <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:gap-4">
      <div
        className={`glass-panel rounded-2xl p-3 sm:p-4 ${
          localSpeaking && !isMuted
            ? "ring-2 ring-[#FF00C2]/50 shadow-[0_0_28px_-8px_rgba(255,0,194,0.5)]"
            : ""
        }`}
      >
        <AudioWaveform
          stream={localStream}
          label="You"
          active={!isMuted}
          variant="local"
        />
      </div>
      <div
        className={`glass-panel rounded-2xl p-3 sm:p-4 ${
          remoteSpeaking
            ? "ring-2 ring-[#4CAF50]/50 shadow-[0_0_28px_-8px_rgba(76,175,80,0.45)]"
            : ""
        }`}
      >
        <AudioWaveform
          stream={remoteStream}
          label="Stranger"
          active
          variant="remote"
        />
      </div>
    </div>
  );
});
