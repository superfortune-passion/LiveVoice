# Test from the internet while the server runs on your PC (Computer A)

Computer B (friend, other city, mobile data) **cannot** open `localhost:3000` or your home `192.168.x.x` — those addresses only exist on **your** machine or Wi‑Fi.

To test **like Vercel users** before deploy, expose your local dev to the internet with a tunnel.

---

## Automatic (recommended)

1. Install [ngrok](https://ngrok.com/download) once.
2. Add your token: `ngrok config add-authtoken YOUR_TOKEN` ([dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)).
3. From repo root:

```powershell
npm run dev:internet
```

This **automatically**:

- Starts ngrok for ports **3000** (web) and **3001** (signaling)
- Writes `web/.env.local` (`NEXT_PUBLIC_SOCKET_URL` + `ALLOWED_DEV_ORIGINS`)
- Starts `dev:server` + `dev:web`
- Prints the **https link** to send Computer B

Or run tunnel only (you start dev yourself):

```powershell
npm run tunnel          # ngrok + env
npm run dev:server      # your terminals
npm run dev:web         # restart web after tunnel
npm run tunnel:stop     # stop ngrok, restore env auto
```

The landing page shows a green **“send Computer B this link”** box when the tunnel is active.

---

## Manual ngrok (if scripts fail)

**On Computer A** — keep your servers running:

```powershell
npm run dev:server
npm run dev:web
```

Then two terminals: `ngrok http 3000` and `ngrok http 3001`, set `NEXT_PUBLIC_SOCKET_URL` in `web/.env.local`, restart web.

**Computer B (anywhere on the internet):**

1. Open only the **WEB URL** (`https://…` from port 3000 tunnel).
2. Same screen as you: Step 1 mic → Step 2 match.
3. Header should show **Network live**.

---

## Checklist

| Step | Computer A | Computer B |
|------|------------|------------|
| Servers | `dev:server` + `dev:web` running | — |
| Tunnels | ngrok 3000 + ngrok 3001 | — |
| Env | `NEXT_PUBLIC_SOCKET_URL` = **3001** https URL | — |
| Browser | Can use localhost or WEB URL | **WEB URL only** |
| Mic | Allow microphone (HTTPS) | Same |

---

## If B still sees blank / no site

- B must use the **https ngrok WEB link**, not `localhost` or your Wi‑Fi IP.
- Restart `npm run dev:web` after changing `.env.local`.
- On ngrok free tier, click **Visit Site** if ngrok shows a warning page.
- Allow ngrok through Windows Firewall when prompted.

---

## After tests pass

Deploy per [DEPLOYMENT.md](./DEPLOYMENT.md):

- Web → Vercel  
- Signaling → Railway/Render  
- `SIGNALING_PROXY_TARGET` on Vercel (no ngrok needed in production)

---

## Optional: same Wi‑Fi only (not internet)

If B is on your home Wi‑Fi only, B can open `http://192.168.x.x:3000` from `http://localhost:3000/api/dev-info` — see [TESTING_PARITY.md](./TESTING_PARITY.md).  
That does **not** work for true internet testers.
