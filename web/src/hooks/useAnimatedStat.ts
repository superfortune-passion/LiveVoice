"use client";

import { useEffect, useRef, useState } from "react";

/** Animates when server stats change — never auto-increments on its own. */
export function useAnimatedStat(target: number, durationMs = 500): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    displayRef.current = display;
  });

  useEffect(() => {
    const from = displayRef.current;
    if (from === target) return;

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (target - from) * eased);
      setDisplay(next);
      displayRef.current = next;
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return display;
}
