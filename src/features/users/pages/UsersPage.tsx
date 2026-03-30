import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusPill } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";

const previewUsers = [
  {
    name: "Maya Cohen",
    email: "maya.cohen@northwind.io",
    role: "SYS_ADMIN",
    status: "Active",
  },
  {
    name: "Daniel Levi",
    email: "daniel.levi@northwind.io",
    role: "TENANT_ADMIN",
    status: "Active",
  },
  {
    name: "Noa Ben-Ami",
    email: "noa.ben-ami@northwind.io",
    role: "USER",
    status: "Pending",
  },
];

function roleTone(role: string) {
  if (role === "SYS_ADMIN") {
    return "warning";
  }

  if (role === "TENANT_ADMIN") {
    return "accent";
  }

  return "neutral";
}

function statusTone(status: string) {
  return status === "Active" ? "success" : "warning";
}

export function UsersPage() {
  return (
    <>
      <PageHeader
        eyebrow="User Management"
        title="Manage tenant users and role assignments"
        description="This screen establishes the table, filtering, and action structure for IAM-backed user administration."
        actions={
          <button className="button button-primary" type="button">
            Create user
          </button>
        }
      />

      <div className="content-grid">
        <div className="stack">
          <SurfaceCard>
            <div className="toolbar">
              <input className="input" type="search" placeholder="Search by name or email" />
              <select className="select" defaultValue="all">
                <option value="all">All roles</option>
                <option value="SYS_ADMIN">SYS_ADMIN</option>
                <option value="TENANT_ADMIN">TENANT_ADMIN</option>
                <option value="USER">USER</option>
              </select>
              <button className="button button-secondary" type="button">
                Export scope
              </button>
            </div>
          </SurfaceCard>

          <div className="info-banner">
            <strong>Preview table only</strong>
            <p>
              Live user data, form validation, and mutation flows will connect to the IAM user-management
              API in the next implementation phase.
            </p>
          </div>

          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewUsers.map((user) => (
                  <tr key={user.email}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <StatusPill tone={roleTone(user.role)}>{user.role}</StatusPill>
                    </td>
                    <td>
                      <StatusPill tone={statusTone(user.status)}>{user.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SurfaceCard>
          <div className="stack">
            <p className="eyebrow">Planned Actions</p>
            <h3>Workflow coverage</h3>
            <ul className="feature-list">
              <li>
                <span className="metric-label">Create and edit users</span>
                <strong>Form-driven</strong>
              </li>
              <li>
                <span className="metric-label">Role assignment</span>
                <strong>RBAC-aware</strong>
              </li>
              <li>
                <span className="metric-label">Delete or deactivate</span>
                <strong>Confirmed mutation</strong>
              </li>
            </ul>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
