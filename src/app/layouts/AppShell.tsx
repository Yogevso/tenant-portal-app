import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { StatusPill } from "../../components/ui/StatusPill";
import { ADMIN_ROLES, getRoleTone } from "../../features/auth/access";
import { useAuth } from "../../features/auth/context/useAuth";
import { env } from "../../lib/config/env";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    roles: ["SYS_ADMIN", "TENANT_ADMIN", "USER"] as const,
  },
  {
    label: "User Management",
    to: "/users",
    roles: ADMIN_ROLES,
  },
  {
    label: "Audit Logs",
    to: "/audit-logs",
    roles: ADMIN_ROLES,
  },
];

export function AppShell() {
  const navigate = useNavigate();
  const { logout, tenant, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const availableNavItems = navItems.filter((item) => (user ? item.roles.includes(user.role) : false));

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Production-style SaaS Portal</p>
          <h1>{env.appName}</h1>
          <p className="sidebar-copy">
            Tenant-aware operations UI for authentication, user administration, and audit visibility.
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {availableNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user ? <StatusPill tone={getRoleTone(user.role)}>{user.role}</StatusPill> : null}
          <div className="sidebar-profile">
            <strong>{user?.fullName ?? "Authenticated User"}</strong>
            <span>{tenant?.name ?? "Tenant scope pending"}</span>
          </div>
          <p>Access token stays in memory. Session recovery uses the backend refresh flow.</p>
          <button className="button button-secondary" type="button" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Signing out..." : "Log out"}
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="app-topbar">
          <div>
            <p className="eyebrow">Authenticated Workspace</p>
            <h2>{tenant?.name ?? "Tenant Portal Frontend"}</h2>
          </div>

          <div className="topbar-meta">
            <div>
              <span className="topbar-label">Signed In As</span>
              <strong>{user?.email ?? "Session pending"}</strong>
            </div>
            {user ? <StatusPill tone={getRoleTone(user.role)}>{user.role}</StatusPill> : null}
            <div>
              <span className="topbar-label">Target API</span>
              <strong>{env.apiBaseUrl}</strong>
            </div>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
