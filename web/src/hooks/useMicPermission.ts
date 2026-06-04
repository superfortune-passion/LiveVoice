"use client";

import { useEffect, useState } from "react";
import { getAppRuntimeMode } from "@/lib/app-environment";
import {
  isSecureContextForMic,
  queryMicPermission,
  type MicPermissionState,
} from "@/lib/mic-access";

/**
 * Tracks microphone permission without prompting.
 * When already granted (returning users), parent can acquire stream without a dialog.
 */
export function useMicPermission(): MicPermissionState {
  const [state, setState] = useState<MicPermissionState>("unknown");

  useEffect(() => {
    let cancelled = false;
    let status: PermissionStatus | null = null;

    const refresh = async () => {
      if (getAppRuntimeMode() === "local-lan" || !isSecureContextForMic()) {
        if (!cancelled) setState("insecure");
        return;
      }
      const next = await queryMicPermission();
      if (!cancelled) setState(next);
    };

    void refresh();

    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((s) => {
          status = s;
          const apply = () => {
            if (cancelled) return;
            if (getAppRuntimeMode() === "local-lan" || !isSecureContextForMic()) {
              setState("insecure");
              return;
            }
            if (s.state === "granted") setState("granted");
            else if (s.state === "denied") setState("denied");
            else if (s.state === "prompt") setState("prompt");
          };
          apply();
          s.onchange = apply;
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      if (status) status.onchange = null;
    };
  }, []);

  return state;
}
