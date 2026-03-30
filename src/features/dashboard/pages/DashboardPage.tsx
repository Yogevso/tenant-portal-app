import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { InlineAlert } from "../../../components/ui/InlineAlert";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { DashboardSkeleton, StatCardSkeleton } from "../../../components/ui/Skeleton";
import { StatusPill } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import type { SystemAdminSummary, TenantAdminSummary } from "../../../types/auth";
import { getRoleTone } from "../../auth/access";
import { getSystemAdminSummary, getTenantAdminSummary } from "../../auth/api/authApi";
import { useAuth } from "../../auth/context/useAuth";

function formatMetric(value: number | undefined) {
  if (value === undefined) {
    return "...";
  }

  return value.toLocaleString();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function DashboardPage() {
  const { accessToken, tenant, user } = useAuth();
  const isAdmin = user?.role === "SYS_ADMIN" || user?.role === "TENANT_ADMIN";
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", user?.role, tenant?.id],
    queryFn: async () => {
      if (!accessToken || !user) {
        throw new Error("A valid session is required to load dashboard metrics.");
      }

      if (user.role === "SYS_ADMIN") {
        return getSystemAdminSummary(accessToken);
      }

      return getTenantAdminSummary(accessToken);
    },
    enabled: Boolean(accessToken && user && isAdmin),
  });

  if (!user || !tenant) {
    return <DashboardSkeleton />;
  }

  const systemSummary =
    user.role === "SYS_ADMIN" ? (summaryQuery.data as SystemAdminSummary | undefined) : undefined;
  const tenantSummary =
    user.role === "TENANT_ADMIN" ? (summaryQuery.data as TenantAdminSummary | undefined) : undefined;
  const routeAccess = user.role === "USER" ? "Dashboard" : "Dashboard, Users, Audit Logs";
  const statCards =
    user.role === "SYS_ADMIN"
      ? [
          {
            label: "Tenants In Scope",
            value: formatMetric(systemSummary?.totalTenants),
            note: "Live tenant count from the system-admin summary endpoint.",
          },
          {
            label: "Platform Users",
            value: formatMetric(systemSummary?.totalUsers),
            note: "All users visible to the current system administrator.",
          },
          {
            label: "System Admins",
            value: formatMetric(systemSummary?.systemAdmins),
            note: "Current users with platform-wide administrative authority.",
          },
        ]
      : user.role === "TENANT_ADMIN"
        ? [
            {
              label: "Users In Tenant",
              value: formatMetric(tenantSummary?.totalUsers),
              note: "Live count for the tenant currently bound to your session.",
            },
            {
              label: "Active Accounts",
              value: formatMetric(tenantSummary?.activeUsers),
              note: "Only active tenant users are counted here.",
            },
            {
              label: "Tenant Admins",
              value: formatMetric(tenantSummary?.tenantAdmins),
              note: "Administrative users within your current tenant scope.",
            },
          ]
        : [
            {
              label: "Current Role",
              value: user.role,
              note: "The IAM backend controls your effective RBAC scope.",
            },
            {
              label: "Tenant Slug",
              value: tenant.slug,
              note: "Tenant context travels with the authenticated session.",
            },
            {
              label: "Session State",
              value: "Authenticated",
              note: "The protected workspace is active and route guards are enforced.",
            },
          ];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user.fullName}`}
        description="This screen now reflects the live IAM session, tenant context, and role-aware entry points available to the signed-in user."
        actions={<StatusPill tone={getRoleTone(user.role)}>{user.role}</StatusPill>}
      />

      <div className="hero-grid">
        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Session Context</p>
            <h3>Current identity and tenant scope</h3>
            <p className="page-copy">
              The frontend now resolves your signed-in identity through the IAM backend and uses that
              context to shape navigation, protected routes, and administrative visibility.
            </p>
            <ul className="session-list">
              <li>
                <span className="metric-label">Full Name</span>
                <strong>{user.fullName}</strong>
              </li>
              <li>
                <span className="metric-label">Email</span>
                <strong>{user.email}</strong>
              </li>
              <li>
                <span className="metric-label">Tenant</span>
                <strong>{tenant.name}</strong>
              </li>
            </ul>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Access Map</p>
            <h3>Role-aware route access</h3>
            <ul className="session-list">
              <li>
                <span className="metric-label">Current Role</span>
                <StatusPill tone={getRoleTone(user.role)}>{user.role}</StatusPill>
              </li>
              <li>
                <span className="metric-label">Tenant Slug</span>
                <strong>{tenant.slug}</strong>
              </li>
              <li>
                <span className="metric-label">Route Access</span>
                <strong>{routeAccess}</strong>
              </li>
            </ul>

            {summaryQuery.isError ? (
              <InlineAlert tone="warning" title="Live metrics unavailable">
                {getErrorMessage(
                  summaryQuery.error,
                  "The dashboard could not load the current summary from the IAM service.",
                )}
              </InlineAlert>
            ) : isAdmin && summaryQuery.isPending ? (
              <InlineAlert tone="info" title="Live metrics loading">
                The dashboard is refreshing the latest summary values for your current scope.
              </InlineAlert>
            ) : null}
          </div>
        </SurfaceCard>
      </div>

      <div className="stat-grid">
        {isAdmin && summaryQuery.isPending
          ? Array.from({ length: 3 }, (_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} note={card.note} />
            ))}
      </div>

      <div className="tile-grid">
        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Authentication</p>
            <h3>Protected session active</h3>
            <p className="helper-text">
              Login, logout, session restore, and protected route enforcement are now backed by the IAM
              auth flow.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Navigation</p>
            <h3>{isAdmin ? "Administrative workflows" : "Personal workspace scope"}</h3>
            <p className="helper-text">
              {isAdmin
                ? "Administrative routes are visible because your current role is allowed to access them."
                : "Administrative routes are hidden because your current role is limited to self-service access."}
            </p>
            {isAdmin ? (
              <div className="split-actions">
                <Link className="button button-secondary" to="/users">
                  Open user management
                </Link>
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Audit Logs</p>
            <h3>{isAdmin ? "Activity review is available" : "Administrative audit access is restricted"}</h3>
            <p className="helper-text">
              {isAdmin
                ? "The audit route is live with backend pagination plus action, actor, and tenant-scope filtering. Date-range filtering remains blocked on backend support."
                : "Audit visibility remains reserved for administrative roles even when a user knows the route."}
            </p>
            {isAdmin ? (
              <div className="split-actions">
                <Link className="button button-secondary" to="/audit-logs">
                  Review audit route
                </Link>
              </div>
            ) : null}
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
