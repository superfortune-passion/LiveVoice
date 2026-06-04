"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppPhase } from "@/types/app";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type ShowcasePhase = Extract<
  AppPhase,
  "idle" | "searching" | "connecting" | "connected"
>;

const CYCLE_MS: Record<ShowcasePhase, number> = {
  idle: 4500,
  searching: 5000,
  connecting: 2800,
  connected: 5500,
};

const ORDER: ShowcasePhase[] = [
  "idle",
  "searching",
  "connecting",
  "connected",
];

export function useShowcasePhase(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<ShowcasePhase>("idle");
  const [partnerSpeaking, setPartnerSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const indexRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!enabled || reducedMotion || paused) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const advance = () => {
      if (cancelled || pausedRef.current) return;
      indexRef.current = (indexRef.current + 1) % ORDER.length;
      const next = ORDER[indexRef.current] ?? "idle";
      setPhase(next);
      setPartnerSpeaking(next === "connected");
      timeoutId = setTimeout(advance, CYCLE_MS[next]);
    };

    timeoutId = setTimeout(advance, CYCLE_MS[ORDER[indexRef.current] ?? "idle"]);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled, reducedMotion, paused]);

  useEffect(() => {
    if (phase !== "connected" || reducedMotion || paused) return;
    const id = setInterval(() => {
      setPartnerSpeaking((p) => !p);
    }, 2200);
    return () => clearInterval(id);
  }, [phase, reducedMotion, paused]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return {
    phase: reducedMotion ? "idle" : phase,
    partnerSpeaking: reducedMotion ? false : partnerSpeaking,
    localSpeaking:
      !reducedMotion && phase === "connected" && !partnerSpeaking,
    paused,
    pause,
    resume,
  };
}
