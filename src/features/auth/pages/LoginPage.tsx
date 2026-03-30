import { Link } from "react-router-dom";

import { SurfaceCard } from "../../../components/ui/SurfaceCard";

export function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">Tenant Access Portal</p>
            <h1>Secure sign-in for tenant operations.</h1>
          </div>

          <p>
            This screen is ready for IAM-backed authentication. Phase 2 will connect the form to JWT
            login, refresh handling, protected routes, and session recovery.
          </p>

          <div className="tile-grid">
            <div className="feature-tile">
              <h3>JWT Session Flow</h3>
              <p>Access tokens, refresh strategy, and clean sign-out handling.</p>
            </div>
            <div className="feature-tile">
              <h3>RBAC-Aware Access</h3>
              <p>Role-specific routes and controls for admins and tenant users.</p>
            </div>
            <div className="feature-tile">
              <h3>Tenant Context</h3>
              <p>Session bootstrap will resolve tenant scope immediately after login.</p>
            </div>
          </div>
        </section>

        <section className="login-form-panel">
          <div>
            <p className="eyebrow">Sign In</p>
            <h2>Connect to the IAM backend</h2>
            <p className="page-description">
              The form contract is in place. Live authentication will be wired in next.
            </p>
          </div>

          <form className="form-grid">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input className="input" id="email" type="email" placeholder="admin@tenant.io" />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input className="input" id="password" type="password" placeholder="Enter your password" />
            </div>

            <button className="button button-primary" type="button" disabled>
              IAM integration in progress
            </button>
          </form>

          <SurfaceCard>
            <div className="stack">
              <h3>Current scaffold scope</h3>
              <p className="helper-text">
                While auth is being connected, you can review the routed app shell and feature screens.
              </p>
              <div className="split-actions">
                <Link className="button button-secondary" to="/dashboard">
                  Review dashboard scaffold
                </Link>
              </div>
            </div>
          </SurfaceCard>
        </section>
      </div>
    </main>
  );
}
