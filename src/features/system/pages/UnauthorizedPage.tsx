import { Link, useLocation } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusPill } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
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

      <SurfaceCard>
        <div className="stack">
          <h3>What this session can do</h3>
          <p className="helper-text">
            Route guards are active now. The frontend hides disallowed navigation by role, but direct
            route attempts still land here instead of showing a broken screen.
          </p>
          {user ? <StatusPill tone={getRoleTone(user.role)}>{user.role}</StatusPill> : null}
          {requiredRoles.length > 0 ? (
            <p className="helper-text">Required role: {requiredRoles.join(" or ")}</p>
          ) : null}
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
