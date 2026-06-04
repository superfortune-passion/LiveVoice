import { getIceServers } from "@/lib/webrtc-config";

let cached: RTCIceServer[] | null = null;
let loading: Promise<RTCIceServer[]> | null = null;

/** Load ICE servers (cached). Tries API route first for fresh bundle on Vercel. */
export async function loadIceServers(): Promise<RTCIceServer[]> {
  if (cached) return cached;
  if (loading) return loading;

  loading = (async () => {
    try {
      const res = await fetch("/api/ice-servers", { cache: "force-cache" });
      if (res.ok) {
        const data = (await res.json()) as { iceServers?: RTCIceServer[] };
        if (data.iceServers?.length) {
          cached = data.iceServers;
          return cached;
        }
      }
    } catch {
      /* fallback below */
    }
    cached = getIceServers();
    return cached;
  })();

  return loading;
}

export function clearIceServerCache(): void {
  cached = null;
  loading = null;
}
