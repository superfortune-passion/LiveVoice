/** Unlock remote <audio> during the same user gesture as Allow mic / Quick match. */
export async function primeAudioOutput(
  el: HTMLAudioElement,
  localStream: MediaStream | null
): Promise<void> {
  if (!localStream?.active) return;
  try {
    el.muted = true;
    el.srcObject = localStream;
    await el.play();
    el.pause();
    el.srcObject = null;
    el.muted = false;
  } catch {
    /* best effort */
  }
}
