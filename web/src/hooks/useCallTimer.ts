"use client";

import { useEffect, useState } from "react";

export function useCallTimer(active: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;

    const start = Date.now();
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => {
      clearInterval(id);
      setSeconds(0);
    };
  }, [active]);

  return active ? seconds : 0;
}

export function formatCallDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
