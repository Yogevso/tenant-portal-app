/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface Window {
  __TENANT_PORTAL_CONFIG__?: {
    appName?: string;
    apiBaseUrl?: string;
  };
}
