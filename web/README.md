# VoiceLink — Web Frontend

Next.js 16 application for the VoiceLink client. For full system design, deployment, and protocols, see the repository root:

- [README.md](../README.md) — overview and quick start
- [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md) — architecture deep dive

## Local development

Run from **repo root** (see [DEVELOPMENT.md](../DEVELOPMENT.md)):

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:web
```

Or from this folder only (signaling must already be running on :3001):

```bash
cp .env.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_SOCKET_URL` in `.env.local` should be `http://localhost:3001`.

## Deploy (Vercel)

- **Root directory:** `web`
- **Env:** `NEXT_PUBLIC_SOCKET_URL`, optional `NEXT_PUBLIC_TURN_*`
