import { Link, useLocation } from "react-router-dom";

import { InlineAlert } from "../../../components/ui/InlineAlert";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusPill } from "../../../components/ui/StatusPill";
import { StatePanel } from "../../../components/ui/StatePanel";
import type { Role } from "../../../types/auth";
import { getRoleTone } from "../../auth/access";
import { useAuth } from "../../auth/context/useAuth";

interface UnauthorizedRouteState {
  fromPath?: string;
  requiredRoles?: Role[];
}

export function UnauthorizedPage() {
  const location = useLocation();
  const { user } = useAuth();
  const routeState = (location.state as UnauthorizedRouteState | null) ?? null;
  const requiredRoles = routeState?.requiredRoles ?? [];
  const targetPath = routeState?.fromPath ?? "this route";

  return (
    <>
      <PageHeader
        eyebrow="Access Control"
        title="You do not have access to this area"
        description={`Your current ${user?.role ?? "signed-in"} session is not allowed to open ${targetPath}.`}
      />

      <StatePanel
        eyebrow="Route Blocked"
        tone="warning"
        title="This route is outside your current role scope"
        description="Client-side route guards are active. The app hides disallowed navigation by role, and direct route attempts land here instead of showing a broken screen."
        actions={
          <>
            <Link className="button button-primary" to="/dashboard">
              Return to dashboard
            </Link>
          </>
        }
      >
        {user ? <StatusPill tone={getRoleTone(user.role)}>{user.role}</StatusPill> : null}
        {requiredRoles.length > 0 ? (
          <InlineAlert tone="warning" title="Required role">
            {requiredRoles.join(" or ")}
          </InlineAlert>
        ) : null}
      </StatePanel>
    </>
  );
}
