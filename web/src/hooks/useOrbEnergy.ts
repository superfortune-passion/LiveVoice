"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { AppPhase } from "@/types/app";
import {
  acquireAnalyser,
  readAverageLevel,
  releaseAnalyser,
  resumeAudioContext,
} from "@/lib/audio-analyser";

/** Drives --orb-energy on an element via rAF (no React re-renders). */
export function useOrbEnergy(
  stream: MediaStream | null | undefined,
  phase: AppPhase,
  demo = false
): RefObject<HTMLDivElement | null> {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let cancelled = false;
    let raf = 0;
    let analyser: AnalyserNode | null = null;
    const hasStream = Boolean(stream?.getAudioTracks().length);

    const tick = () => {
      if (cancelled) return;
      let energy = 0.15;

      if (hasStream && stream && analyser) {
        energy = Math.min(1, readAverageLevel(analyser) / 70);
      } else if (demo) {
        frameRef.current += 1;
        const f = frameRef.current;
        const wave =
          phase === "searching"
            ? Math.sin(f * 0.2) * 0.35 + 0.45
            : phase === "connected"
              ? Math.sin(f * 0.12) * 0.25 + 0.35
              : Math.sin(f * 0.08) * 0.2 + 0.25;
        energy = wave;
      }

      el.style.setProperty("--orb-energy", String(energy));
      raf = requestAnimationFrame(tick);
    };

    void (async () => {
      if (hasStream && stream) {
        await resumeAudioContext();
        if (cancelled) return;
        analyser = acquireAnalyser(stream);
      }
      tick();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream && hasStream) releaseAnalyser(stream);
      el.style.removeProperty("--orb-energy");
    };
  }, [stream, phase, demo]);

  return rootRef;
}
