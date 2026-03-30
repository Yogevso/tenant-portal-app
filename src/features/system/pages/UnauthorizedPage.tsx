import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";

export function UnauthorizedPage() {
  return (
    <>
      <PageHeader
        eyebrow="Access Control"
        title="You do not have access to this area"
        description="This route is reserved for future RBAC enforcement once the IAM session model is wired into the app."
      />

      <SurfaceCard>
        <div className="stack">
          <h3>What happens next</h3>
          <p className="helper-text">
            In the auth integration phase, unauthorized navigation attempts will redirect here with
            role-aware messaging.
          </p>
          <div className="split-actions">
            <Link className="button button-primary" to="/dashboard">
              Return to dashboard
            </Link>
          </div>
        </div>
      </SurfaceCard>
    </>
  );
}
