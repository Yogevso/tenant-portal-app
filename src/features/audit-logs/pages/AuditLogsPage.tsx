import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusPill } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";

const previewEvents = [
  {
    timestamp: "2026-03-30 11:24",
    actor: "maya.cohen@northwind.io",
    action: "USER_ROLE_UPDATED",
    scope: "Northwind Holdings",
  },
  {
    timestamp: "2026-03-30 10:58",
    actor: "system",
    action: "REFRESH_TOKEN_ISSUED",
    scope: "Platform",
  },
  {
    timestamp: "2026-03-30 09:42",
    actor: "daniel.levi@northwind.io",
    action: "USER_CREATED",
    scope: "Northwind Holdings",
  },
];

export function AuditLogsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Audit Logs"
        title="Inspect administrative and access activity"
        description="The table layout and filter bar are ready for IAM audit events, tenant scoping, and operational review."
        actions={<StatusPill tone="accent">Filterable Table</StatusPill>}
      />

      <div className="content-grid">
        <div className="stack">
          <SurfaceCard>
            <div className="toolbar">
              <select className="select" defaultValue="all">
                <option value="all">All actions</option>
                <option value="USER_CREATED">User created</option>
                <option value="USER_ROLE_UPDATED">Role updated</option>
                <option value="LOGIN">Login</option>
              </select>
              <input className="input" type="text" placeholder="Actor email" />
              <input className="input" type="text" placeholder="Date range" />
            </div>
          </SurfaceCard>

          <div className="info-banner">
            <strong>Audit viewer scaffold</strong>
            <p>
              Filtering is visual only for now. The next feature phase will bind these controls to the
              IAM audit-log endpoints.
            </p>
          </div>

          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Scope</th>
                </tr>
              </thead>
              <tbody>
                {previewEvents.map((event) => (
                  <tr key={`${event.timestamp}-${event.action}`}>
                    <td>{event.timestamp}</td>
                    <td>{event.actor}</td>
                    <td>{event.action}</td>
                    <td>{event.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Target Filtering</p>
            <h3>Review dimensions</h3>
            <ul className="feature-list">
              <li>
                <span className="metric-label">Date range</span>
                <strong>Supported</strong>
              </li>
              <li>
                <span className="metric-label">Actor and action type</span>
                <strong>Supported</strong>
              </li>
              <li>
                <span className="metric-label">Tenant scope</span>
                <strong>Role-aware</strong>
              </li>
            </ul>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
