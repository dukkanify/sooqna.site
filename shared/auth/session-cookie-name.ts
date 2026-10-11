/** Client-safe session cookie name (must match server `SESSION_COOKIE_NAME`). */
export const SESSION_COOKIE_NAME = "sooqna_session";

/** True when the browser likely has a Sooqna session cookie. */
export function hasBrowserSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${SESSION_COOKIE_NAME}=`));
}
