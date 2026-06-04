/**
 * ICE servers: STUN by default; optional TURN via env (required for many mobile/carrier NATs).
 *
 * Env (Vercel / web):
 * - NEXT_PUBLIC_TURN_URL=turn:turn.example.com:3478
 * - NEXT_PUBLIC_TURN_USERNAME / NEXT_PUBLIC_TURN_CREDENTIAL
 * - NEXT_PUBLIC_TURN_URLS — comma-separated extra URLs (optional)
 *
 * Full musician RTCPeerConnection config: `@/lib/musician-webrtc`.
 */
export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPass = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  const extra = process.env.NEXT_PUBLIC_TURN_URLS;
  const urls = [turnUrl, ...(extra ? extra.split(",").map((u) => u.trim()) : [])].filter(
    Boolean
  ) as string[];

  for (const url of urls) {
    servers.push({
      urls: url,
      ...(turnUser && turnPass
        ? { username: turnUser, credential: turnPass }
        : {}),
    });
  }

  return servers;
}
