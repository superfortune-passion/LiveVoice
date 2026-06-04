# Testing parity — Computer A, Computer B, and Vercel users

**Rule:** VoiceLink is deployed on **Vercel**. Before deploy, you test with two computers. **Computer A and Computer B must see the same UI and follow the same steps** as users on `https://your-app.vercel.app`.

> **Computer B on the internet while your server is on your PC?**  
> They **cannot** use `localhost` or `192.168.x.x`. Use **ngrok** → [TESTING_INTERNET_LOCAL_SERVER.md](./TESTING_INTERNET_LOCAL_SERVER.md)

---

## What is identical everywhere

| Feature | Computer A | Computer B | Vercel user |
|---------|------------|--------------|-------------|
| Landing layout | Same | Same | Same |
| Step 1 — Allow microphone | Same button & flow* | Same* | Same* |
| Step 2 — Interests + match | Same | Same | Same |
| Signaling / matchmaking | Same server rules | Same | Public signaling URL |
| WebRTC voice | Same | Same | Same (+ TURN recommended) |

\*Mic **only** matches Vercel when the page is a **secure context**: `https://` or `http://localhost` / `127.0.0.1`. Plain `http://192.168.x.x` blocks the mic in Chrome — that is a browser rule, not a VoiceLink bug.

---

## Pre-deploy test plan (recommended)

### Phase 1 — Two computers, same LAN (network + match)

**Computer A (host)** — repo root:

```powershell
npm run dev:server    # terminal 1 — port 3001
npm run dev:web       # terminal 2 — port 3000
```

On A, open `http://localhost:3000`. The app shows a **Computer B** URL (or call `http://localhost:3000/api/dev-info`).

**Computer B** — same Wi‑Fi:

1. Open **exactly** the URL A shares, e.g. `http://192.168.1.50:3000` — **not** `localhost`.
2. Header should go **Online / Network live** on both.
3. Both: **Allow microphone** (B may show LAN mic warning — see Phase 2).
4. Both: **Quick match** → should connect.

### Phase 2 — Same mic result as Vercel (before deploy)

Pick **one** (same for A and B):

| Method | Both computers open |
|--------|---------------------|
| **A. Vercel Preview** (best) | `https://your-app-xxx.vercel.app` |
| **B. HTTPS tunnel** | Same `https://….ngrok.io` or Cloudflare URL |
| **C. Chrome flag (dev only)** | `http://192.168.x.x:3000` after adding origin in `chrome://flags/#unsafely-treat-insecure-origin-as-secure` on **both** PCs |

Then both should get the **same Allow microphone** browser prompt as production.

### Phase 3 — Production

1. Deploy `server/` → Railway/Render → `https://signaling…`
2. Vercel env: `SIGNALING_PROXY_TARGET=https://signaling…`, `NEXT_PUBLIC_SOCKET_URL=auto`
3. Two phones/PCs open **only** the Vercel HTTPS URL.

---

## Checklist (A and B must match)

- [ ] Same URL in the address bar (not `localhost` on B)
- [ ] Green / **Network live** in header on both
- [ ] **Microphone ready** on both (or same error text on both)
- [ ] Match connects voice both ways
- [ ] Skip / End behave the same

---

## Env (host machine)

**`web/.env.local`**

```env
NEXT_PUBLIC_SOCKET_URL=auto
```

**`server/.env`**

```env
HOST=0.0.0.0
CLIENT_ORIGIN=*
PORT=3001
```

Client connects to `http://<page-host>:3001` automatically in dev/LAN.

---

## Do not

- Open `localhost:3000` on Computer B (points to B itself, not the host).
- Expect mic on `http://192.168.x.x` without HTTPS or the Chrome flag — UI will show the same **insecure** message on both (that is correct).
- Deploy web-only to Vercel without a public signaling server.

See [DEVELOPMENT.md](./DEVELOPMENT.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).
