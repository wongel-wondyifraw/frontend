export const TOKEN_COOKIE = "cms_token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function setAuthCookie(token: string, rememberMe = false): void {
  if (typeof document === "undefined") return;
  const maxAge = rememberMe
    ? REMEMBER_MAX_AGE_SECONDS
    : SESSION_MAX_AGE_SECONDS;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
