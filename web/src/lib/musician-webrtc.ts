/**
 * Musician-optimized WebRTC configuration.
 *
 * Design goals:
 * - Minimize conversational round-trip time on good paths (<50 ms RTT class).
 * - Prefer Opus with short frame sizes where the browser supports codec preferences.
 * - Keep playback on <audio> for remote streams (browser jitter buffer is highly tuned).
 * - Use Web Audio analysers only for visualization (see audio-analyser.ts).
 */

import { getIceServers } from "@/lib/webrtc-config";

/** Capture constraints: browser DSP + mono 48 kHz when available. */
export const MUSICIAN_AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48_000 },
  },
  video: false,
};

/**
 * RTCPeerConnection settings tuned for interactive voice.
 * DTLS-SRTP is mandatory in WebRTC — cannot be disabled.
 */
export function getMusicianRtcConfiguration(
  iceServers?: RTCIceServer[],
  iceTransportPolicy: RTCIceTransportPolicy = "all"
): RTCConfiguration {
  return {
    iceServers: iceServers ?? getIceServers(),
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceTransportPolicy,
  };
}

/**
 * Prefer Opus and short minptime when setCodecPreferences is available.
 * Falls back silently on browsers without codec capabilities API.
 */
export function preferLowLatencyOpus(pc: RTCPeerConnection): void {
  if (typeof RTCRtpSender === "undefined" || !RTCRtpSender.getCapabilities) {
    return;
  }

  try {
    const caps = RTCRtpSender.getCapabilities("audio");
    if (!caps?.codecs?.length) return;

    const opus = caps.codecs.filter(
      (c) => c.mimeType.toLowerCase() === "audio/opus"
    );
    const others = caps.codecs.filter(
      (c) => c.mimeType.toLowerCase() !== "audio/opus"
    );
    if (opus.length === 0) return;

    const ordered = [...opus, ...others];
    for (const transceiver of pc.getTransceivers()) {
      if (transceiver.sender.track?.kind === "audio") {
        transceiver.setCodecPreferences(ordered);
      }
    }
  } catch {
    /* Safari / older builds may throw — safe to ignore */
  }
}

/** Target RTT class for nearby users (informational). */
export const MUSICIAN_RTT_TARGET_MS = 50;
