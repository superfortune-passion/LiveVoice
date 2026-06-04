/**
 * Single source of truth for how VoiceLink behaves in the browser.
 * Computer A, Computer B, and Vercel users should follow the same rules here.
 */

import { isSecureContextForMic } from "./mic-access";

/** Matches production (Vercel HTTPS) vs local test modes. */
export type AppRuntimeMode =
  | "production"
  | "local-secure"
  | "local-lan";

export function getAppRuntimeMode(): AppRuntimeMode {
  if (typeof window === "undefined") return "production";

  const { hostname, protocol } = window.location;

  if (
    protocol === "https:" ||
    hostname.endsWith(".vercel.app") ||
    (!isPrivateLanHost(hostname) &&
      hostname !== "localhost" &&
      hostname !== "127.0.0.1")
  ) {
    return "production";
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "local-secure";
  }

  if (isPrivateLanHost(hostname)) {
    return "local-lan";
  }

  return "production";
}

export function isPrivateLanHost(hostname: string): boolean {
  return (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

/** Mic + UI parity with Vercel (HTTPS secure context). */
export function hasProductionMicParity(): boolean {
  return isSecureContextForMic() && getAppRuntimeMode() !== "local-lan";
}

export function micStepDescription(permission: string): string {
  if (permission === "denied") {
    return "Microphone was blocked. Allow it in your browser site settings, then tap Allow microphone again.";
  }
  if (permission === "insecure" || getAppRuntimeMode() === "local-lan") {
    return (
      "Same as Vercel users: open an HTTPS link. On Wi‑Fi tests use an HTTPS tunnel, Vercel Preview, " +
      "or Chrome’s insecure-origin flag on both PCs (see TESTING_PARITY.md)."
    );
  }
  return "Your browser will ask to use the microphone — same flow as on Vercel. Required for voice chat.";
}

export function networkStatusHint(socketConnected: boolean, connectError?: string | null): string {
  if (socketConnected) return "";
  if (connectError) return `Network error: ${connectError}`;
  const mode = getAppRuntimeMode();
  if (mode === "production") {
    return "Set SIGNALING_PROXY_TARGET on Vercel (see DEPLOYMENT.md).";
  }
  return "Start npm run dev:server. If Computer B is on the internet, use ngrok — see TESTING_INTERNET_LOCAL_SERVER.md.";
}

/** URL both computers must use for matching (current page origin). */
export function getCanonicalTestUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
