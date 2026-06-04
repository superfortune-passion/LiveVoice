/** Client-side action throttle to prevent rapid double-clicks. */

export function createThrottle(ms: number) {
  let last = 0;
  return (): boolean => {
    const now = Date.now();
    if (now - last < ms) return false;
    last = now;
    return true;
  };
}
