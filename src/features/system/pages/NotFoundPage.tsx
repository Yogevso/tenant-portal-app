import { Link } from "react-router-dom";

import { SurfaceCard } from "../../../components/ui/SurfaceCard";

export function NotFoundPage() {
  return (
    <main className="login-page">
      <SurfaceCard className="stack">
        <p className="eyebrow">404</p>
        <h3>Page not found</h3>
        <p className="helper-text">
          The route does not exist in the current portal scaffold. Use the primary navigation to continue.
        </p>
        <div className="split-actions">
          <Link className="button button-primary" to="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </SurfaceCard>
    </main>
  );
}
