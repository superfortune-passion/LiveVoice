import type { CorsOptions } from "cors";

/**
 * CORS for HTTP + Socket.io.
 * - CLIENT_ORIGIN=* → any browser origin (good for global internet + previews)
 * - Comma-separated list → explicit allowlist
 * - ALLOW_VERCEL_PREVIEWS=true → also allow *.vercel.app (PR previews)
 */
export function parseClientOrigins(): string[] | "*" {
  const raw = (process.env.CLIENT_ORIGIN ?? "*").trim() || "*";
  if (raw === "*" || raw === "all") return "*";
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isAllowAllOrigins(): boolean {
  return parseClientOrigins() === "*";
}

function allowVercelPreviews(): boolean {
  return process.env.ALLOW_VERCEL_PREVIEWS === "true";
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const origins = parseClientOrigins();
  if (origins === "*") return true;
  if (origins.includes(origin)) return true;

  if (allowVercelPreviews()) {
    try {
      const host = new URL(origin).hostname;
      if (host.endsWith(".vercel.app")) return true;
    } catch {
      /* invalid origin */
    }
  }

  return false;
}

export function createExpressCorsOptions(): CorsOptions {
  if (isAllowAllOrigins()) {
    return { origin: true, credentials: true };
  }
  return {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
  };
}

export function createSocketIoCorsOptions(): {
  origin: CorsOptions["origin"];
  methods: string[];
  credentials: boolean;
} {
  if (isAllowAllOrigins()) {
    return {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"],
    };
  }
  return {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
    methods: ["GET", "POST"],
  };
}
