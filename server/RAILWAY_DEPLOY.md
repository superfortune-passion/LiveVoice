# Deploy only `server/` on Railway (step by step)

## Step 1 — Open your service
Railway → project **LiveVoice** → click the **service** (not the project name).

## Step 2 — Root directory
**Settings** → **Source** → **Root Directory** → type: `server` → **Save**.

## Step 3 — Builder (if build failed)
**Settings** → **Build**:
- **Builder:** Nixpacks (recommended), or Dockerfile if you prefer Docker
- **Build command:** `npm install && npm run build`
- **Start command:** `npm run start`

## Step 4 — Variables
**Variables** tab → add:

```
NODE_ENV=production
HOST=0.0.0.0
CLIENT_ORIGIN=*
ALLOW_VERCEL_PREVIEWS=true
```

(Do not set `PORT` — Railway sets it.)

## Step 5 — Redeploy
**Deployments** → **⋯** on latest → **Redeploy**, or push a small commit to GitHub.

## Step 6 — Public URL
**Settings** → **Networking** → **Generate Domain**.

## Step 7 — Test
Open: `https://YOUR-DOMAIN.up.railway.app/health`  
Must show: `"ok": true`

Copy that base URL (no `/health`) for Vercel later:
`NEXT_PUBLIC_SOCKET_URL=https://YOUR-DOMAIN.up.railway.app`
