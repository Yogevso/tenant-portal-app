import { NavLink, Outlet } from "react-router-dom";

import { StatusPill } from "../../components/ui/StatusPill";
import { env } from "../../lib/config/env";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    label: "User Management",
    to: "/users",
  },
  {
    label: "Audit Logs",
    to: "/audit-logs",
  },
  {
    label: "Login",
    to: "/login",
  },
];

export function AppShell() {
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
          {navItems.map((item) => (
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
          <StatusPill tone="accent">Phase 1</StatusPill>
          <p>Core shell and route structure in place. IAM integration is next.</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="app-topbar">
          <div>
            <p className="eyebrow">Foundation Build</p>
            <h2>Tenant Portal Frontend</h2>
          </div>

          <div className="topbar-meta">
            <div>
              <span className="topbar-label">Target API</span>
              <strong>{env.apiBaseUrl}</strong>
            </div>
            <StatusPill tone="neutral">Vite + React + TypeScript</StatusPill>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
