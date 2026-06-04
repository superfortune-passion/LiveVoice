/** Run non-critical client work after first paint. */
export function scheduleAfterPaint(task: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(task, { timeout: 600 });
    return () => cancelIdleCallback(id);
  }

  const id = window.setTimeout(task, 1);
  return () => clearTimeout(id);
}
