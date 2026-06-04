/** Shared Web Audio resources — one context, refcounted analysers per stream. */

const BAR_BUFFER = new Uint8Array(256);

let sharedContext: AudioContext | null = null;

interface StreamEntry {
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  refCount: number;
}

const streamEntries = new WeakMap<MediaStream, StreamEntry>();

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getContext();
  if (ctx?.state === "suspended") await ctx.resume();
}

export function acquireAnalyser(stream: MediaStream): AnalyserNode | null {
  const ctx = getContext();
  if (!ctx || !stream.getAudioTracks().length) return null;

  const existing = streamEntries.get(stream);
  if (existing) {
    existing.refCount += 1;
    return existing.analyser;
  }

  try {
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;
    source.connect(analyser);
    streamEntries.set(stream, { source, analyser, refCount: 1 });
    return analyser;
  } catch {
    return null;
  }
}

export function releaseAnalyser(stream: MediaStream): void {
  const entry = streamEntries.get(stream);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    entry.source.disconnect();
    streamEntries.delete(stream);
  }
}

export function readBarLevels(
  analyser: AnalyserNode,
  barCount: number,
  out: Float32Array
): void {
  analyser.getByteFrequencyData(BAR_BUFFER);
  const step = Math.floor(BAR_BUFFER.length / barCount);
  for (let i = 0; i < barCount; i++) {
    const start = i * step;
    let sum = 0;
    for (let j = 0; j < step; j++) sum += BAR_BUFFER[start + j] ?? 0;
    const avg = sum / step;
    out[i] = Math.max(0.08, Math.min(1, avg / 90));
  }
}

export function readAverageLevel(analyser: AnalyserNode): number {
  analyser.getByteFrequencyData(BAR_BUFFER);
  let sum = 0;
  for (let i = 0; i < BAR_BUFFER.length; i++) sum += BAR_BUFFER[i] ?? 0;
  return sum / BAR_BUFFER.length;
}

export function closeSharedAudioContext(): void {
  if (sharedContext && sharedContext.state !== "closed") {
    void sharedContext.close();
  }
  sharedContext = null;
}
