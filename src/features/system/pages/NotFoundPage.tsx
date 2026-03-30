import { Link } from "react-router-dom";

import { StatePanel } from "../../../components/ui/StatePanel";

export function NotFoundPage() {
  return (
    <main className="login-page">
      <StatePanel
        centered
        eyebrow="404"
        tone="warning"
        title="Page not found"
        description="The route does not exist in the current portal. Use the primary navigation to continue."
        actions={
          <Link className="button button-primary" to="/dashboard">
            Go to dashboard
          </Link>
        }
      />
    </main>
  );
}
