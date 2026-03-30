export interface AppRuntimeConfig {
  appName?: string;
  apiBaseUrl?: string;
}

export interface AppEnv {
  appName: string;
  apiBaseUrl: string;
}

const DEFAULT_APP_NAME = "Tenant Portal";
const DEFAULT_API_BASE_URL = "http://localhost:8000";

function normalizeValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeBaseUrl(value: string | undefined) {
  const normalized = normalizeValue(value);

  if (!normalized) {
    return undefined;
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function resolveAppEnv(options: {
  runtimeConfig?: AppRuntimeConfig | null;
  viteEnv?: {
    VITE_APP_NAME?: string;
    VITE_API_BASE_URL?: string;
  };
} = {}): AppEnv {
  const appName =
    normalizeValue(options.runtimeConfig?.appName) ??
    normalizeValue(options.viteEnv?.VITE_APP_NAME) ??
    DEFAULT_APP_NAME;
  const apiBaseUrl =
    normalizeBaseUrl(options.runtimeConfig?.apiBaseUrl) ??
    normalizeBaseUrl(options.viteEnv?.VITE_API_BASE_URL) ??
    DEFAULT_API_BASE_URL;

  return {
    appName,
    apiBaseUrl,
  };
}

function getRuntimeConfig() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.__TENANT_PORTAL_CONFIG__;
}

export const env = resolveAppEnv({
  runtimeConfig: getRuntimeConfig(),
  viteEnv: import.meta.env,
});
