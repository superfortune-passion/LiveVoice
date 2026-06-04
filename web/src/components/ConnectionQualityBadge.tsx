"use client";

import { memo } from "react";
import type { ConnectionQuality } from "@/hooks/useConnectionQuality";
import { MUSICIAN_RTT_TARGET_MS } from "@/lib/musician-webrtc";

interface ConnectionQualityBadgeProps {
  quality: ConnectionQuality;
}

export const ConnectionQualityBadge = memo(function ConnectionQualityBadge({
  quality,
}: ConnectionQualityBadgeProps) {
  const { rttMs, candidateType, isLowLatency } = quality;

  if (rttMs === null) {
    return (
      <span className="text-[10px] font-medium text-[#B0B8C8]">
        Measuring link…
      </span>
    );
  }

  const pathLabel =
    candidateType === "relay"
      ? "Relay"
      : candidateType === "host"
        ? "Direct"
        : candidateType ?? "P2P";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-right">
      <span
        className={
          isLowLatency
            ? "rounded-full border border-[#4CAF50]/40 bg-[#4CAF50]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4CAF50]"
            : "rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200"
        }
      >
        {isLowLatency ? "Low latency" : `RTT > ${MUSICIAN_RTT_TARGET_MS}ms`}
      </span>
      <span className="font-mono text-sm tabular-nums text-white">
        {rttMs} ms
      </span>
      <span className="text-[10px] text-[#B0B8C8]">{pathLabel}</span>
    </div>
  );
});
