# Manual development guide

**You** start and stop VoiceLink locally. Nothing in this repo auto-launches dev servers for you.

## Prerequisites

- Node.js 20+
- npm 10+
- One-time setup from repo root:

```powershell
cd C:\projects\Hinabi
npm install
npm install --prefix web
npm install --prefix server
copy web\.env.example web\.env.local
copy server\.env.example server\.env
```

## Option A — Two terminals (recommended)

Full control: stop web or server independently with `Ctrl+C` in that terminal.

**Terminal 1 — signaling (port 3001)**

```powershell
cd C:\projects\Hinabi
npm run dev:server
```

**Terminal 2 — web (port 3000)**

```powershell
cd C:\projects\Hinabi
npm run dev:web
```

Open http://localhost:3000

## Option B — One terminal (both services)

Runs web + server together via `concurrently`. Quit **both** with a single `Ctrl+C`.

```powershell
cd C:\projects\Hinabi
npm run stop
npm run dev
```

If signaling does not start, you will **not** see `CORS: all origins (*)` — only the web app runs. Free port **3001** with `npm run stop` first, or use `npm run dev:clean`.

## Quit / stop

| How you started | How to stop |
|-----------------|-------------|
| Two terminals | `Ctrl+C` in each terminal |
| `npm run dev` | `Ctrl+C` once in that terminal |
| Stuck process on 3000/3001 | `npm run stop` or `.\scripts\stop-dev.ps1` |

## Helper scripts (optional)

From repo root in PowerShell:

```powershell
.\scripts\start-server.ps1   # signaling only
.\scripts\start-web.ps1      # frontend only
.\scripts\stop-dev.ps1       # kill listeners on 3000 and 3001
```

## Verify

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| Signaling | http://localhost:3001 |
| Health | http://localhost:3001/health |

## Computer A + Computer B (same result as Vercel users)

**Computer B on the internet (your server local):** [TESTING_INTERNET_LOCAL_SERVER.md](./TESTING_INTERNET_LOCAL_SERVER.md)  
**Same Wi‑Fi / parity:** [TESTING_PARITY.md](./TESTING_PARITY.md)

| Rule | Detail |
|------|--------|
| Production target | **Vercel** (`DEPLOYMENT.md`) |
| A and B same URL | B opens host LAN URL, e.g. `http://192.168.x.x:3000` — **not** `localhost` on B |
| Same UI | One codebase; mic/network copy from `web/src/lib/app-environment.ts` |
| Mic = Vercel | Only on **HTTPS** or **localhost**; LAN `http://IP` shows the **same** warning on A and B |
| Signaling | Client uses `http://<page-host>:3001` in dev/LAN (`NEXT_PUBLIC_SOCKET_URL=auto`) |

**Host env:** `web/.env.local` → `NEXT_PUBLIC_SOCKET_URL=auto`  
**Server env:** `HOST=0.0.0.0`, `CLIENT_ORIGIN=*`

Dev helper: `http://localhost:3000/api/dev-info` lists URLs for Computer B.

Before deploy, use **Vercel Preview** or an **HTTPS tunnel** on both PCs for identical mic behavior.

## Production build (no dev server)

```powershell
cd C:\projects\Hinabi
npm run build
npm run start:server   # terminal 1
npm run start:web      # terminal 2
```

## For AI / Cursor assistants

Do **not** start `npm run dev` in the background unless the user explicitly asks. The user runs and quits dev servers manually.
