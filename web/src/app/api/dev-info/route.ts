import os from "os";
import { NextResponse } from "next/server";

/** Dev-only: share URLs so Computer B uses the same host as Computer A (not localhost). */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const ips = new Set<string>();
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        ips.add(entry.address);
      }
    }
  }

  const lanUrls = [...ips].map((ip) => `http://${ip}:3000`);
  const signalingUrls = [...ips].map((ip) => `http://${ip}:3001`);

  return NextResponse.json({
    rule:
      "Computer B on the INTERNET cannot use localhost or 192.168.x.x. Use an HTTPS tunnel (ngrok).",
    computerBWebUrls: lanUrls,
    signalingUrls,
    healthExample: signalingUrls[0] ? `${signalingUrls[0]}/health` : null,
    internetTest: {
      doc: "TESTING_INTERNET_LOCAL_SERVER.md",
      steps: [
        "Terminal: ngrok http 3000 → share this https URL with Computer B (web)",
        "Terminal: ngrok http 3001 → put in web/.env.local as NEXT_PUBLIC_SOCKET_URL=https://…",
        "Restart npm run dev:web",
        "Computer B opens only the https:// (3000) link — same UI and mic as Vercel",
      ],
      envExample: "web/.env.tunnel.example",
    },
    vercelParity:
      "HTTPS tunnel or Vercel Preview = same mic as production. See TESTING_INTERNET_LOCAL_SERVER.md",
  });
}
