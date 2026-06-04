/**
 * ICE servers: STUN + optional TURN via env.
 * Without TURN, many users match in the UI but hear no audio (NAT/firewall).
 *
 * Env (Vercel / web) — overrides built-in Open Relay fallback:
 * - NEXT_PUBLIC_TURN_URL=turn:global.relay.metered.ca:443
 * - NEXT_PUBLIC_TURN_USERNAME / NEXT_PUBLIC_TURN_CREDENTIAL
 * - NEXT_PUBLIC_TURN_URLS — comma-separated extra URLs (optional)
 *
 * Full musician RTCPeerConnection config: `@/lib/musician-webrtc`.
 */

/** Free Open Relay fallback (Metered) — used when env TURN is not set. */
const OPEN_RELAY = {
  username: "openrelayproject",
  credential: "openrelayproject",
  turnUrls: [
    "turn:openrelay.metered.ca:80",
    "turn:openrelay.metered.ca:443",
    "turn:openrelay.metered.ca:443?transport=tcp",
    "turns:openrelay.metered.ca:443?transport=tcp",
  ] as const,
};

function hasEnvTurn(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURN_URL ||
      process.env.NEXT_PUBLIC_TURN_URLS ||
      (process.env.NEXT_PUBLIC_TURN_USERNAME &&
        process.env.NEXT_PUBLIC_TURN_CREDENTIAL)
  );
}

export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.relay.metered.ca:80" },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnPass = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  const extra = process.env.NEXT_PUBLIC_TURN_URLS;
  const urls = [
    turnUrl,
    ...(extra ? extra.split(",").map((u) => u.trim()) : []),
  ].filter(Boolean) as string[];

  for (const url of urls) {
    servers.push({
      urls: url,
      ...(turnUser && turnPass
        ? { username: turnUser, credential: turnPass }
        : {}),
    });
  }

  if (!hasEnvTurn()) {
    for (const url of OPEN_RELAY.turnUrls) {
      servers.push({
        urls: url,
        username: OPEN_RELAY.username,
        credential: OPEN_RELAY.credential,
      });
    }
  }

  return servers;
}
