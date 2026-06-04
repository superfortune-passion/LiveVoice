import type { NextConfig } from "next";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** All local IPv4 addresses — so any LAN device can load Next dev client/HMR. */
function getLocalNetworkHosts(): string[] {
  const port = process.env.PORT ?? process.env.WEB_DEV_PORT ?? "3000";
  const hosts = new Set<string>([
    "localhost",
    "127.0.0.1",
    `localhost:${port}`,
    `127.0.0.1:${port}`,
  ]);
  const ifaces = os.networkInterfaces();
  for (const entries of Object.values(ifaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        hosts.add(entry.address);
        hosts.add(`${entry.address}:${port}`);
      }
    }
  }
  const fromEnv = process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv) {
    for (const item of fromEnv) {
      hosts.add(item);
      if (!item.includes(":")) {
        hosts.add(`${item}:${port}`);
      }
    }
  }
  return [...hosts];
}

const signalingProxy =
  process.env.SIGNALING_PROXY_TARGET ?? "http://127.0.0.1:3001";

/** Injected into the client bundle when SOCKET_URL=auto (Vercel: set SIGNALING_PROXY_TARGET). */
const signalingPublic =
  process.env.NEXT_PUBLIC_SIGNALING_URL?.trim() ||
  process.env.SIGNALING_PROXY_TARGET?.trim() ||
  "";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SIGNALING_URL: signalingPublic,
  },
  turbopack: {
    root: rootDir,
  },
  allowedDevOrigins: getLocalNetworkHosts(),
  async rewrites() {
    return [
      {
        source: "/socket.io",
        destination: `${signalingProxy}/socket.io`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${signalingProxy}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
