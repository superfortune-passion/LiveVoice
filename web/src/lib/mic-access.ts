/** Browser microphone access helpers (HTTPS / secure context). */

export function isMicApiAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/**
 * getUserMedia requires a secure context.
 * https:// is secure; http://localhost is secure; http://192.168.x.x is not.
 */
export function isSecureContextForMic(): boolean {
  if (typeof window === "undefined") return true;
  if (window.isSecureContext) return true;
  const { hostname, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (protocol === "https:") return true;
  return false;
}

export type MicPermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported"
  | "insecure";

export async function queryMicPermission(): Promise<MicPermissionState> {
  if (!isMicApiAvailable()) return "unsupported";
  if (!isSecureContextForMic()) return "insecure";

  try {
    const permissions = navigator.permissions;
    if (!permissions?.query) return "unknown";
    const status = await permissions.query({
      name: "microphone" as PermissionName,
    });
    if (status.state === "granted") return "granted";
    if (status.state === "denied") return "denied";
    if (status.state === "prompt") return "prompt";
    return "unknown";
  } catch {
    return "unknown";
  }
}
