"use client";

import { memo, useEffect, useRef } from "react";
import type { AppPhase } from "@/types/app";
import {
  acquireAnalyser,
  readBarLevels,
  releaseAnalyser,
  resumeAudioContext,
} from "@/lib/audio-analyser";

export type WaveformVariant = "local" | "remote" | "neutral";

interface CanvasWaveformProps {
  stream?: MediaStream | null;
  demo?: boolean;
  demoIntensity?: number;
  demoPhase?: AppPhase;
  barCount?: number;
  variant?: WaveformVariant;
  className?: string;
  height?: number;
}

const GRADIENTS: Record<WaveformVariant, [string, string, string]> = {
  local: ["#00E5FF", "#FF00C2", "#FF0062"],
  remote: ["#4CAF50", "#00E5FF", "#4CAF50"],
  neutral: ["#00E5FF", "#FF00C2", "#FF0062"],
};

function drawBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  levels: Float32Array,
  variant: WaveformVariant
): void {
  const count = levels.length;
  const gap = width < 280 ? 2 : 3;
  const barW = Math.max(2, (width - gap * (count - 1)) / count);
  const [c0, c1, c2] = GRADIENTS[variant];
  const grad = ctx.createLinearGradient(0, height, 0, 0);
  grad.addColorStop(0, c0);
  grad.addColorStop(0.5, c1);
  grad.addColorStop(1, c2);

  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < count; i++) {
    const level = levels[i]!;
    const h = Math.max(4, level * height);
    const x = i * (barW + gap);
    const y = height - h;
    ctx.fillStyle = grad;
    ctx.shadowColor =
      variant === "remote"
        ? "rgba(76, 175, 80, 0.55)"
        : "rgba(255, 0, 194, 0.45)";
    ctx.shadowBlur = level > 0.35 ? 8 + level * 10 : 0;
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, barW / 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barW, h);
    }
  }
  ctx.shadowBlur = 0;
}

function computeDemoLevels(
  frame: number,
  count: number,
  intensity: number,
  phase: AppPhase | undefined,
  out: Float32Array
): void {
  const speed = phase === "searching" ? 0.22 : phase === "connected" ? 0.14 : 0.1;
  for (let i = 0; i < count; i++) {
    const wave =
      Math.sin(frame * speed + i * 0.35) * 0.5 +
      Math.sin(frame * (speed * 0.55) + i * 0.12) * 0.3;
    const base = 0.15 + wave * 0.38 * intensity;
    out[i] = Math.max(0.1, Math.min(1, base + Math.sin(frame * 0.4 + i) * 0.05));
  }
}

export const CanvasWaveform = memo(function CanvasWaveform({
  stream = null,
  demo = false,
  demoIntensity = 1,
  demoPhase,
  barCount = 32,
  variant = "neutral",
  className = "",
  height = 96,
}: CanvasWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef(new Float32Array(barCount));
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  const activeRef = useRef(true);

  useEffect(() => {
    levelsRef.current = new Float32Array(barCount);
  }, [barCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    activeRef.current = true;
    const levels = levelsRef.current;
    const hasStream = Boolean(stream?.getAudioTracks().length);
    let analyser: AnalyserNode | null = null;

    const resize = () => {
      const parent = canvas.parentElement;
      const cssW = parent?.clientWidth ?? 320;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${height}px`;
    };

    const paint = () => {
      if (!activeRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      resize();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const w = canvas.width;
      const h = canvas.height;

      if (hasStream && stream && analyser) {
        readBarLevels(analyser, barCount, levels);
      } else if (demo) {
        frameRef.current += 1;
        computeDemoLevels(
          frameRef.current,
          barCount,
          demoIntensity,
          demoPhase,
          levels
        );
      } else {
        for (let i = 0; i < barCount; i++) levels[i] = 0.08;
      }

      drawBars(ctx, w, h, levels, variant);
      rafRef.current = requestAnimationFrame(paint);
    };

    const start = async () => {
      if (hasStream && stream) {
        await resumeAudioContext();
        analyser = acquireAnalyser(stream);
      }
      resize();
      rafRef.current = requestAnimationFrame(paint);
    };

    void start();

    const ro = new ResizeObserver(() => resize());
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (stream && hasStream) releaseAnalyser(stream);
    };
  }, [stream, demo, demoIntensity, demoPhase, barCount, variant, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full ${className}`}
      aria-hidden
    />
  );
});
