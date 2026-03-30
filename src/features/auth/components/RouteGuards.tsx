import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { StatusPill } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import type { Role } from "../../../types/auth";
import { useAuth } from "../context/useAuth";

interface GuestOnlyRouteProps {
  children: ReactNode;
}

interface RequireRolesProps {
  allowedRoles: Role[];
}

function AuthGateScreen(props: { eyebrow: string; title: string; description: string }) {
  return (
    <main className="login-page auth-gate">
      <SurfaceCard>
        <div className="stack auth-gate-card">
          <StatusPill tone="accent">{props.eyebrow}</StatusPill>
          <h2>{props.title}</h2>
          <p className="page-description">{props.description}</p>
        </div>
      </SurfaceCard>
    </main>
  );
}

export function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <AuthGateScreen
        eyebrow="Session Bootstrap"
        title="Restoring your last portal session"
        description="The app is checking whether an existing refresh session can be resumed."
      />
    );
  }

  if (status === "authenticated") {
    return <Navigate replace to="/dashboard" />;
  }

  return <>{children}</>;
}

export function RequireAuth() {
  const location = useLocation();
  const { status, authFailureReason } = useAuth();

  if (status === "loading") {
    return (
      <AuthGateScreen
        eyebrow="Authentication"
        title="Preparing the protected workspace"
        description="Protected routes stay paused until the IAM session check finishes."
      />
    );
  }

  if (status !== "authenticated") {
    return (
      <Navigate
        replace
        to="/login"
        state={{
          fromPath: `${location.pathname}${location.search}`,
          reason: authFailureReason,
        }}
      />
    );
  }

  return <Outlet />;
}

export function RequireRoles({ allowedRoles }: RequireRolesProps) {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        replace
        to="/unauthorized"
        state={{
          fromPath: `${location.pathname}${location.search}`,
          requiredRoles: allowedRoles,
        }}
      />
    );
  }

  return <Outlet />;
}
