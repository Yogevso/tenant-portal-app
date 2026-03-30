import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { StatusPill } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";

const statCards = [
  {
    label: "Users In Scope",
    value: "128",
    note: "Preview metric for tenant-aware user counts.",
  },
  {
    label: "Recent Audit Events",
    value: "1,204",
    note: "Layout placeholder for log volume visibility.",
  },
  {
    label: "Active Roles",
    value: "3",
    note: "Mapped to SYS_ADMIN, TENANT_ADMIN, and USER.",
  },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Operational visibility for admins and tenant users"
        description="This foundation view defines the layout for session context, tenant overview, and role-aware navigation entry points."
        actions={<StatusPill tone="accent">Scaffold Ready</StatusPill>}
      />

      <div className="hero-grid">
        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Product Intent</p>
            <h3>One portal for access, users, and audit visibility</h3>
            <p className="page-copy">
              The dashboard is designed to become the first screen after login. It will surface current
              user identity, tenant context, role permissions, and quick actions tied to the IAM backend.
            </p>
            <div className="info-banner">
              <strong>Next integration step</strong>
              <p>
                Replace preview metrics and session content with live IAM-backed data during the auth and
                dashboard phases.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Session Preview</p>
            <h3>Target dashboard summary</h3>
            <ul className="session-list">
              <li>
                <span className="metric-label">Current Role</span>
                <StatusPill tone="warning">TENANT_ADMIN</StatusPill>
              </li>
              <li>
                <span className="metric-label">Tenant</span>
                <strong>Northwind Holdings</strong>
              </li>
              <li>
                <span className="metric-label">Route Access</span>
                <strong>Dashboard, Users, Audit Logs</strong>
              </li>
            </ul>
          </div>
        </SurfaceCard>
      </div>

      <div className="stat-grid">
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} note={card.note} />
        ))}
      </div>

      <div className="tile-grid">
        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Authentication</p>
            <h3>Session bootstrap</h3>
            <p className="helper-text">
              Login, logout, refresh, and route protection will be wired into the IAM service next.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">User Management</p>
            <h3>Administrative workflows</h3>
            <p className="helper-text">
              The UI footprint is ready for list, create, edit, delete, and role assignment actions.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Audit Logs</p>
            <h3>Activity review</h3>
            <p className="helper-text">
              Filtering, event inspection, and tenant scoping will land in the next feature slice.
            </p>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
