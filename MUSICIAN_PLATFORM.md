# VoiceLink — Musician Platform Guide

Quick reference for how the shipped MVP achieves **low-latency musician-focused voice** and how to run/deploy it.

## How WebRTC is used

1. User grants microphone with **musician capture constraints** (`web/src/lib/musician-webrtc.ts`): echo cancellation, noise suppression, AGC, mono 48 kHz.
2. Signaling server pairs users and relays **SDP + ICE** only (Socket.io).
3. Browser creates `RTCPeerConnection` with **max-bundle**, ICE pooling, and **Opus preference** when supported.
4. Audio flows **peer-to-peer** encrypted with **DTLS-SRTP** — not through Node.
5. Remote audio plays via `<audio>` (browser jitter buffer + packet loss concealment).
6. Waveforms use **AnalyserNode** taps — no per-frame React state.

See [LOW_LATENCY_AUDIO.md](./LOW_LATENCY_AUDIO.md) for ICE/STUN/TURN and jitter theory.

## Interest-based matchmaking

1. Client sends `start-search` with up to 10 sanitized tags.
2. Server scores waiters by `|A ∩ B|` and picks randomly within the best tier.
3. No overlap → random pairing (Omegle-style fallback).
4. Initiator for WebRTC is chosen by `socketId.localeCompare(peerId)`.

See [SYSTEM_ARCHITECTURE.md §5](./SYSTEM_ARCHITECTURE.md#5-matchmaking-architecture).

## Low-latency musician mode (shipped)

| Technique | Location |
|-----------|----------|
| Opus + short frames (codec preference) | `preferLowLatencyOpus()` |
| ICE pre-gather pool | `iceCandidatePoolSize: 4` |
| Musician mic constraints | `MUSICIAN_AUDIO_CONSTRAINTS` |
| RTT badge in-call | `useConnectionQuality` (polls every 2s) |
| P2P media path | `useWebRTC` — no server audio relay |
| Cleanup on skip/disconnect | `teardownPeer`, `stopStreamTracks` |

**Target:** ≤50 ms RTT class for nearby users on direct ICE (badge turns green).

**Not in MVP:** sample-accurate jam sync — see [FUTURE_MUSIC_MODE.md](./FUTURE_MUSIC_MODE.md).

## Reconnect & skip

- Socket reconnect → auto `start-search` with saved interests (`useMatchmaking`).
- Partner skip/disconnect → `endPeerOnly()` + re-queue after 1.5 s (`AppShell`).
- Server notifies both sides with `peer-disconnected` / `searching`.

## Run locally

```bash
npm run dev:server   # :3001
npm run dev:web      # :3000
```

## Deploy

| Component | Host | Env |
|-----------|------|-----|
| `web/` | Vercel | `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_TURN_*` |
| `server/` | Railway / Render / Fly / Docker | `CLIENT_ORIGIN`, `PORT`, `HOST` |

## Future: Jam Mode

- Client stub: `web/src/lib/jam-mode-stub.ts`
- Server stub: `server/src/jam-relay-stub.ts`
- Architecture: [FUTURE_MUSIC_MODE.md](./FUTURE_MUSIC_MODE.md)
