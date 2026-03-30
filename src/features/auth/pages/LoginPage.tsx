import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { InlineAlert } from "../../../components/ui/InlineAlert";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { ApiError } from "../../../lib/api/client";
import { env } from "../../../lib/config/env";
import { useAuth } from "../context/useAuth";

const loginSchema = z.object({
  tenantSlug: z
    .string()
    .trim()
    .min(3, "Tenant slug must be at least 3 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginRouteState {
  fromPath?: string;
  reason?: "session_expired" | "service_unavailable" | null;
}

const loginHighlights = [
  {
    eyebrow: "Identity",
    title: "Tenant-scoped access",
    description: "Every sign-in carries tenant context, user email, and password into the IAM flow.",
  },
  {
    eyebrow: "Authorization",
    title: "Role-aware workspace",
    description: "The portal reshapes navigation and route access for SYS_ADMIN, TENANT_ADMIN, and USER.",
  },
  {
    eyebrow: "Recovery",
    title: "Session continuity",
    description: "Refresh rotation restores valid workspaces after reload without keeping access tokens in storage.",
  },
] as const;

const loginPrinciples = [
  "Memory-only access tokens",
  "Refresh-backed session restore",
  "Role-aware route protection",
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authFailureReason, clearAuthFailureReason, login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const routeState = (location.state as LoginRouteState | null) ?? null;
  const redirectTarget = routeState?.fromPath ?? "/dashboard";
  const sessionNotice = routeState?.reason ?? authFailureReason;
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      tenantSlug: "",
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      await login(values);
    },
    onSuccess: () => {
      navigate(redirectTarget, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "validation_error" && error.details) {
        const fieldMap: Record<string, keyof LoginFormValues> = {
          "body.tenant_slug": "tenantSlug",
          "body.email": "email",
          "body.password": "password",
        };

        error.details.forEach((detail) => {
          const fieldName = fieldMap[detail.field];

          if (fieldName) {
            setError(fieldName, {
              type: "server",
              message: detail.message,
            });
          }
        });
      }

      setFormError(error instanceof Error ? error.message : "The portal could not complete sign-in.");
    },
  });

  function onSubmit(values: LoginFormValues) {
    clearAuthFailureReason();
    setFormError(null);
    loginMutation.mutate(values);
  }

  const apiTargetLabel =
    env.apiBaseUrl === "same-origin" ? "Current origin proxy to the IAM backend" : env.apiBaseUrl;

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-panel">
          <div className="login-panel-header">
            <p className="eyebrow">Tenant Access Portal</p>
            <h1>Secure sign-in for tenant operations.</h1>
            <p className="login-intro">
              Sign in with tenant context, email, and password. The portal keeps the access token in
              memory and uses the IAM refresh flow to restore the session after a reload.
            </p>
          </div>

          <div className="login-principle-row" aria-label="Core session principles">
            {loginPrinciples.map((principle) => (
              <span key={principle} className="login-principle">
                {principle}
              </span>
            ))}
          </div>

          <div className="login-feature-grid">
            {loginHighlights.map((highlight) => (
              <article key={highlight.title} className="login-feature-card">
                <span className="login-feature-eyebrow">{highlight.eyebrow}</span>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>

          <div className="login-runtime-note">
            <p className="eyebrow">Runtime posture</p>
            <p className="muted-copy">
              Access tokens never persist between browser sessions. Session storage only keeps the
              refresh path long enough to restore the workspace while the backend session is still valid.
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-header">
            <div>
              <p className="eyebrow">Sign In</p>
              <h2>Connect to the IAM backend</h2>
            </div>

            <div className="login-api-card">
              <span className="topbar-label">Target API</span>
              <strong>{apiTargetLabel}</strong>
            </div>
          </div>

          {sessionNotice === "session_expired" ? (
            <InlineAlert tone="warning" title="Session expired">
              Your previous session expired. Sign in again to continue.
            </InlineAlert>
          ) : null}

          {sessionNotice === "service_unavailable" ? (
            <InlineAlert tone="warning" title="Session restore unavailable">
              The portal could not restore the last session. Verify that the IAM service is running,
              then sign in again.
            </InlineAlert>
          ) : null}

          {formError ? (
            <InlineAlert tone="danger" title="Sign-in failed">
              {formError}
            </InlineAlert>
          ) : null}

          <form className="form-grid" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="field">
              <label htmlFor="tenantSlug">Tenant Slug</label>
              <input
                aria-describedby={errors.tenantSlug ? "tenantSlug-error" : undefined}
                aria-invalid={Boolean(errors.tenantSlug)}
                autoComplete="organization"
                className="input"
                id="tenantSlug"
                placeholder="platform"
                {...register("tenantSlug")}
              />
              {errors.tenantSlug ? (
                <span className="field-error" id="tenantSlug-error">
                  {errors.tenantSlug.message}
                </span>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={Boolean(errors.email)}
                autoComplete="username"
                className="input"
                id="email"
                type="email"
                placeholder="admin@tenant.io"
                {...register("email")}
              />
              {errors.email ? (
                <span className="field-error" id="email-error">
                  {errors.email.message}
                </span>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                aria-describedby={errors.password ? "password-error" : undefined}
                aria-invalid={Boolean(errors.password)}
                autoComplete="current-password"
                className="input"
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
              />
              {errors.password ? (
                <span className="field-error" id="password-error">
                  {errors.password.message}
                </span>
              ) : null}
            </div>

            <button
              aria-busy={isSubmitting || loginMutation.isPending}
              className="button button-primary"
              type="submit"
              disabled={isSubmitting || loginMutation.isPending}
            >
              {isSubmitting || loginMutation.isPending ? "Signing in..." : "Sign in to the portal"}
            </button>
          </form>

          <SurfaceCard className="login-support-card">
            <div className="stack">
              <h3>Session model</h3>
              <ul className="login-support-list">
                <li>
                  <span className="metric-label">Access token</span>
                  <strong>In memory only</strong>
                </li>
                <li>
                  <span className="metric-label">Refresh token</span>
                  <strong>Session storage only</strong>
                </li>
                <li>
                  <span className="metric-label">Recovery path</span>
                  <strong>Backend refresh rotation</strong>
                </li>
              </ul>
            </div>
          </SurfaceCard>
        </section>
      </div>
    </main>
  );
}
