import { describe, expect, it } from "vitest";

import { resolveAppEnv } from "../src/lib/config/env";

describe("resolveAppEnv", () => {
  it("prefers runtime configuration over build-time values", () => {
    expect(
      resolveAppEnv({
        runtimeConfig: {
          appName: "Tenant Portal (Staging)",
          apiBaseUrl: "https://staging-iam.example.com/",
        },
        viteEnv: {
          VITE_APP_NAME: "Tenant Portal (Build)",
          VITE_API_BASE_URL: "http://localhost:8000",
        },
      }),
    ).toEqual({
      appName: "Tenant Portal (Staging)",
      apiBaseUrl: "https://staging-iam.example.com",
    });
  });

  it("falls back to build-time values and defaults when runtime config is absent", () => {
    expect(
      resolveAppEnv({
        runtimeConfig: {
          appName: "   ",
          apiBaseUrl: "",
        },
        viteEnv: {
          VITE_APP_NAME: "Tenant Portal (Development)",
          VITE_API_BASE_URL: "http://localhost:8000/",
        },
      }),
    ).toEqual({
      appName: "Tenant Portal (Development)",
      apiBaseUrl: "http://localhost:8000",
    });
  });

  it("uses safe defaults when neither runtime nor build-time config is present", () => {
    expect(resolveAppEnv()).toEqual({
      appName: "Tenant Portal",
      apiBaseUrl: "http://localhost:8000",
    });
  });
});
