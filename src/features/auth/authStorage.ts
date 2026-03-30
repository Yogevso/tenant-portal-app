const REFRESH_TOKEN_STORAGE_KEY = "tenant-portal.refresh-token";

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function readStoredRefreshToken() {
  return getSessionStorage()?.getItem(REFRESH_TOKEN_STORAGE_KEY) ?? null;
}

export function writeStoredRefreshToken(refreshToken: string) {
  getSessionStorage()?.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearStoredRefreshToken() {
  getSessionStorage()?.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}
