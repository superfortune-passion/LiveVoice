/** Wait for ICE gathering to finish (or timeout) before sending SDP. */
export function waitForIceGathering(
  pc: RTCPeerConnection,
  timeoutMs = 5000
): Promise<void> {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      clearTimeout(timer);
      resolve();
    };

    const onChange = () => {
      if (pc.iceGatheringState === "complete") finish();
    };

    pc.addEventListener("icegatheringstatechange", onChange);
    const timer = setTimeout(finish, timeoutMs);
  });
}
