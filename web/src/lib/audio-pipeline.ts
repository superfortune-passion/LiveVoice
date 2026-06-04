/**
 * Optional Web Audio gain stage for local monitoring level.
 *
 * Remote playback stays on HTMLAudioElement in useWebRTC — adding a Web Audio
 * graph to remote output would duplicate jitter buffering and add delay.
 * Packet loss concealment and jitter buffering remain inside WebRTC's RTP stack.
 */

import { resumeAudioContext } from "@/lib/audio-analyser";

export interface LocalMonitorPipeline {
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  gain: GainNode;
  /** Tap for analysers — connect visualizers here, not to destination. */
  tap: GainNode;
  dispose: () => void;
}

/**
 * Builds a local-only gain graph (does not replace WebRTC send path).
 * Use for musician input level preview / future UI slider.
 */
export async function createLocalMonitorPipeline(
  stream: MediaStream,
  initialGain = 1
): Promise<LocalMonitorPipeline | null> {
  if (typeof window === "undefined" || !stream.getAudioTracks().length) {
    return null;
  }

  const context = new AudioContext();
  await resumeAudioContext();

  const source = context.createMediaStreamSource(stream);
  const gain = context.createGain();
  const tap = context.createGain();
  gain.gain.value = initialGain;
  tap.gain.value = 1;

  source.connect(gain);
  gain.connect(tap);
  // Intentionally no connect(tap, destination) — avoid local monitoring latency/echo.

  return {
    context,
    source,
    gain,
    tap,
    dispose: () => {
      try {
        source.disconnect();
        gain.disconnect();
        tap.disconnect();
      } catch {
        /* ignore */
      }
      void context.close();
    },
  };
}
