"use client";

import { useEffect, useState } from "react";
import { MUSICIAN_RTT_TARGET_MS } from "@/lib/musician-webrtc";

export interface ConnectionQuality {
  rttMs: number | null;
  candidateType: string | null;
  packetsLost: number | null;
  jitterMs: number | null;
  isLowLatency: boolean;
  iceConnectionState: RTCIceConnectionState | null;
}

const EMPTY_QUALITY: ConnectionQuality = {
  rttMs: null,
  candidateType: null,
  packetsLost: null,
  jitterMs: null,
  isLowLatency: false,
  iceConnectionState: null,
};

const POLL_MS = 2000;

async function readStats(
  pc: RTCPeerConnection | null
): Promise<ConnectionQuality> {
  if (!pc) return EMPTY_QUALITY;

  const iceConnectionState = pc.iceConnectionState;

  if (pc.connectionState !== "connected") {
    return { ...EMPTY_QUALITY, iceConnectionState };
  }

  try {
    const report = await pc.getStats();
    let rttMs: number | null = null;
    let candidateType: string | null = null;
    let packetsLost: number | null = null;
    let jitterMs: number | null = null;

    report.forEach((stat) => {
      if (stat.type === "candidate-pair" && stat.state === "succeeded") {
        const rtt = stat.currentRoundTripTime;
        if (typeof rtt === "number") rttMs = Math.round(rtt * 1000);
        const localId = stat.localCandidateId;
        if (localId) {
          const local = report.get(localId);
          if (local && "candidateType" in local) {
            candidateType = String(local.candidateType);
          }
        }
      }
      if (stat.type === "inbound-rtp" && stat.kind === "audio") {
        if (typeof stat.packetsLost === "number") packetsLost = stat.packetsLost;
        if (typeof stat.jitter === "number") jitterMs = Math.round(stat.jitter * 1000);
      }
    });

    return {
      rttMs,
      candidateType,
      packetsLost,
      jitterMs,
      isLowLatency: rttMs !== null && rttMs <= MUSICIAN_RTT_TARGET_MS,
      iceConnectionState,
    };
  } catch {
    return { ...EMPTY_QUALITY, iceConnectionState };
  }
}

export function useConnectionQuality(
  getPeerConnection: () => RTCPeerConnection | null,
  active: boolean
): ConnectionQuality {
  const [quality, setQuality] = useState(EMPTY_QUALITY);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const tick = async () => {
      const next = await readStats(getPeerConnection());
      if (!cancelled) setQuality(next);
    };

    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [active, getPeerConnection]);

  if (!active) return EMPTY_QUALITY;
  return quality;
}
