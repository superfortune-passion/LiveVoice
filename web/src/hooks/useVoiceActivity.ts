"use client";

import { useEffect, useRef, useState } from "react";
import {
  acquireAnalyser,
  readAverageLevel,
  releaseAnalyser,
  resumeAudioContext,
} from "@/lib/audio-analyser";

const SPEAKING_THRESHOLD = 18;
const POLL_MS = 100;

/**
 * Detects voice activity; only re-renders when speaking boolean changes.
 */
export function useVoiceActivity(stream: MediaStream | null): boolean {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const hasStream = Boolean(stream?.getAudioTracks().length);

  useEffect(() => {
    if (!hasStream || !stream) {
      if (speakingRef.current) {
        speakingRef.current = false;
        setIsSpeaking(false);
      }
      return;
    }

    const track = stream.getAudioTracks()[0];
    let cancelled = false;
    let analyser: AnalyserNode | null = null;

    const setSpeaking = (next: boolean) => {
      if (speakingRef.current === next) return;
      speakingRef.current = next;
      setIsSpeaking(next);
    };

    const tick = () => {
      if (cancelled || !analyser) return;
      if (!track.enabled || track.muted) {
        setSpeaking(false);
      } else {
        const avg = readAverageLevel(analyser);
        setSpeaking(avg > SPEAKING_THRESHOLD);
      }
      timerRef.current = window.setTimeout(tick, POLL_MS);
    };

    void (async () => {
      await resumeAudioContext();
      if (cancelled) return;
      analyser = acquireAnalyser(stream);
      if (analyser) tick();
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      releaseAnalyser(stream);
      speakingRef.current = false;
    };
  }, [stream, hasStream]);

  return hasStream ? isSpeaking : false;
}
