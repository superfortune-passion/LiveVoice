"use client";

import { useMemo } from "react";
import type { AppPhase } from "@/types/app";
import type { ConnectionStatus } from "@/types/socket";
import type { MicError } from "@/hooks/useWebRTC";

interface UseAppPhaseOptions {
  inSession: boolean;
  connectionStatus: ConnectionStatus;
  micError: MicError;
  hasLocalStream: boolean;
  rtcReady: boolean;
  voiceLinkReady?: boolean;
  isRequestingMic: boolean;
}

export function useAppPhase({
  inSession,
  connectionStatus,
  micError,
  hasLocalStream,
  rtcReady,
  voiceLinkReady = true,
  isRequestingMic,
}: UseAppPhaseOptions): AppPhase {
  return useMemo(() => {
    if (!inSession) return "idle";

    if (connectionStatus === "error") return "error";

    if (micError && !hasLocalStream) {
      return micError === "denied" ? "mic_permission" : "error";
    }

    if (isRequestingMic && !hasLocalStream) return "mic_permission";

    if (connectionStatus === "disconnected") return "peer_disconnected";

    if (connectionStatus === "searching") return "searching";

    if (connectionStatus === "connected") {
      if (!rtcReady || !voiceLinkReady) return "connecting";
      return "connected";
    }

    return "idle";
  }, [
    inSession,
    connectionStatus,
    micError,
    hasLocalStream,
    rtcReady,
    voiceLinkReady,
    isRequestingMic,
  ]);
}

export function micErrorMessage(error: MicError): string | null {
  switch (error) {
    case "denied":
      return "Microphone access was denied. Allow mic permission in your browser settings.";
    case "not-found":
      return "No microphone was found on this device.";
    case "not-supported":
      return "This browser does not support voice chat.";
    case "insecure":
      return "Microphone only works on https:// or localhost. Use localhost on this PC, or HTTPS (tunnel) for other devices.";
    case "unknown":
      return "Could not access your microphone. Please try again.";
    default:
      return null;
  }
}
