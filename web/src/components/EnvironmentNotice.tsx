"use client";

import { memo, useEffect, useState } from "react";
import {
  getAppRuntimeMode,
  getCanonicalTestUrl,
  hasProductionMicParity,
} from "@/lib/app-environment";

type DevInfo = {
  computerBWebUrls: string[];
  internetTest?: { doc: string; steps: string[] };
  vercelParity: string;
};

type TunnelInfo = {
  active: boolean;
  shareWithComputerB?: string;
  signalingUrl?: string;
};

export const EnvironmentNotice = memo(function EnvironmentNotice() {
  const mode = getAppRuntimeMode();
  const [devInfo, setDevInfo] = useState<DevInfo | null>(null);
  const [tunnel, setTunnel] = useState<TunnelInfo | null>(null);
  const micOk = hasProductionMicParity();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    void fetch("/api/dev-info")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDevInfo(data as DevInfo);
      })
      .catch(() => {});
    void fetch("/api/tunnel-info")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setTunnel(data as TunnelInfo);
      })
      .catch(() => {});
  }, []);

  if (process.env.NODE_ENV === "production" && mode === "production") {
    return null;
  }

  const onHostLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const shareUrl = tunnel?.active
    ? tunnel.shareWithComputerB
    : devInfo?.computerBWebUrls[0];

  return (
    <div
      className="rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-[11px] leading-relaxed text-[#B0B8C8]"
      role="note"
    >
      {tunnel?.active && tunnel.shareWithComputerB && (
        <div className="mb-2 rounded-lg border border-[#4CAF50]/35 bg-[#4CAF50]/10 p-2">
          <p className="font-bold text-[#4CAF50]">
            Internet test active — send Computer B this link
          </p>
          <p className="mt-1 break-all font-mono text-sm text-white">
            {tunnel.shareWithComputerB}
          </p>
          <p className="mt-1 text-[#B0B8C8]">
            Same screen & mic as Vercel (HTTPS). Signaling configured automatically.
          </p>
        </div>
      )}

      {onHostLocalhost && !tunnel?.active && (
        <div className="mb-2 rounded-lg border border-[#00E5FF]/25 bg-[#00E5FF]/8 p-2">
          <p className="font-bold text-[#00E5FF]">Computer B on the internet?</p>
          <p className="mt-1">
            Run from repo root:{" "}
            <code className="rounded bg-black/30 px-1 text-white">npm run tunnel</code>{" "}
            (needs ngrok). Or one command:{" "}
            <code className="rounded bg-black/30 px-1 text-white">npm run dev:internet</code>
          </p>
        </div>
      )}

      <p className="font-bold text-white/90">
        {tunnel?.active
          ? "Tunnel mode — production-like HTTPS"
          : mode === "production"
            ? "Production (Vercel)"
            : mode === "local-secure"
              ? onHostLocalhost
                ? "Host PC — localhost only on this machine"
                : "HTTPS — same mic & UI as Vercel"
              : "Same Wi‑Fi only — run npm run tunnel for internet"}
      </p>

      {!micOk && mode === "local-lan" && !tunnel?.active && (
        <p className="mt-1 text-amber-200/90">{devInfo?.vercelParity}</p>
      )}

      {shareUrl && onHostLocalhost && !tunnel?.active && (
        <p className="mt-1">
          <span className="text-[#B0B8C8]">Same Wi‑Fi only:</span>{" "}
          <code className="rounded bg-black/30 px-1 text-white">{shareUrl}</code>
        </p>
      )}

      {mode === "local-lan" && !tunnel?.active && (
        <p className="mt-1">
          URL:{" "}
          <code className="rounded bg-black/30 px-1 text-white">
            {getCanonicalTestUrl()}
          </code>
        </p>
      )}
    </div>
  );
});
