import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { StatusPill } from "../../components/ui/StatusPill";
import { ADMIN_ROLES, getRoleTone } from "../../features/auth/access";
import { useAuth } from "../../features/auth/context/useAuth";
import { env } from "../../lib/config/env";
import type { Role } from "../../types/auth";

const navItems = [
  {
    label: "Dashboard",
    shortLabel: "DB",
    to: "/dashboard",
    roles: ["SYS_ADMIN", "TENANT_ADMIN", "USER"] as const,
  },
  {
    label: "User Management",
    shortLabel: "UM",
    to: "/users",
    roles: ADMIN_ROLES,
  },
  {
    label: "Audit Logs",
    shortLabel: "AL",
    to: "/audit-logs",
    roles: ADMIN_ROLES,
  },
];

function getCompactRoleLabel(role: Role) {
  if (role === "SYS_ADMIN") {
    return "SA";
  }

  if (role === "TENANT_ADMIN") {
    return "TA";
  }

  return "US";
}

function getInitials(value: string | undefined) {
  const parts = value
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts || parts.length === 0) {
    return "AU";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

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
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true" title={env.appName}>
            TP
          </div>

          <div className="brand-copy-group">
            <p className="eyebrow">Production-style SaaS Portal</p>
            <h1>{env.appName}</h1>
            <p className="sidebar-copy">
              Tenant-aware operations UI for authentication, user administration, and audit visibility.
            </p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {availableNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              title={item.label}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.shortLabel}
              </span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <StatusPill tone={getRoleTone(user.role)}>
              <span className="sidebar-role-full">{user.role}</span>
              <span className="sidebar-role-compact" aria-hidden="true">
                {getCompactRoleLabel(user.role)}
              </span>
            </StatusPill>
          ) : null}

          <div className="sidebar-profile">
            <span className="sidebar-avatar" aria-hidden="true" title={user?.fullName ?? "User"}>
              {getInitials(user?.fullName)}
            </span>

            <div className="sidebar-profile-copy">
              <strong>{user?.fullName ?? "Authenticated User"}</strong>
              <span>{tenant?.name ?? "Tenant scope pending"}</span>
            </div>
          </div>

          <p className="sidebar-session-note">
            Access token stays in memory. Session recovery uses the backend refresh flow.
          </p>

          <button
            className="button button-secondary sidebar-logout-button"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Log out"
          >
            <span className="sidebar-button-full">{isLoggingOut ? "Signing out..." : "Log out"}</span>
            <span className="sidebar-button-compact" aria-hidden="true">
              {isLoggingOut ? "..." : "Out"}
            </span>
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

        <main className="page" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
