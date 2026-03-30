import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { StatusPill } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import type { AuditAction, AuditActor, AuditLogItem } from "../../../types/audit";
import type { TenantRecord } from "../../../types/tenants";
import { useAuth } from "../../auth/context/useAuth";
import { listManagedUsers, listTenants } from "../../users/api/userManagementApi";
import { listSystemAuditLogs, listTenantAuditLogs } from "../api/auditApi";

const AUDIT_PAGE_SIZE = 20;

const actionOptions: Array<{ value: "all" | AuditAction; label: string }> = [
  { value: "all", label: "All actions" },
  { value: "LOGIN_SUCCESS", label: "Login success" },
  { value: "LOGIN_FAILURE", label: "Login failure" },
  { value: "USER_CREATED", label: "User created" },
  { value: "USER_DEACTIVATED", label: "User deactivated" },
  { value: "ROLE_CHANGED", label: "Role changed" },
  { value: "TOKEN_REVOKED", label: "Token revoked" },
  { value: "TENANT_CREATED", label: "Tenant created" },
  { value: "TENANT_UPDATED", label: "Tenant updated" },
];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatScopeLabel(tenant: TenantRecord | null, isGlobal: boolean) {
  if (isGlobal) {
    return "All tenants";
  }

  if (!tenant) {
    return "Tenant scope pending";
  }

  return `${tenant.name} (${tenant.slug})`;
}

function buildActorLabel(actor: AuditActor | null) {
  if (!actor) {
    return "System";
  }

  return `${actor.fullName} (${actor.email})`;
}

function summarizeDetails(item: AuditLogItem) {
  const detailEntries = Object.entries(item.details ?? {});

  if (detailEntries.length === 0) {
    return `${item.resourceType}:${item.resourceId}`;
  }

  return detailEntries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

export function AuditLogsPage() {
  const { authenticatedRequest, tenant: currentTenant, user: currentUser } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedAction, setSelectedAction] = useState<"all" | AuditAction>("all");
  const [selectedActorId, setSelectedActorId] = useState("");
  const [offset, setOffset] = useState(0);

  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: () => listTenants(authenticatedRequest),
    enabled: currentUser?.role === "SYS_ADMIN",
  });

  useEffect(() => {
    if (currentUser?.role !== "SYS_ADMIN") {
      setSelectedTenantId(currentTenant?.id ?? "");
    }
  }, [currentTenant?.id, currentUser?.role]);

  useEffect(() => {
    setSelectedActorId("");
    setOffset(0);
  }, [selectedTenantId]);

  useEffect(() => {
    setOffset(0);
  }, [selectedAction, selectedActorId]);

  const selectedTenant: TenantRecord | null =
    currentUser?.role === "SYS_ADMIN"
      ? tenantsQuery.data?.find((tenant) => tenant.id === selectedTenantId) ?? null
      : currentTenant
        ? {
            id: currentTenant.id,
            name: currentTenant.name,
            slug: currentTenant.slug,
            isActive: true,
          }
        : null;

  const scopedUserTenantId =
    currentUser?.role === "SYS_ADMIN" ? (selectedTenantId || null) : (currentTenant?.id ?? null);

  const scopedUsersQuery = useQuery({
    queryKey: ["audit-actor-users", scopedUserTenantId],
    queryFn: () => listManagedUsers(authenticatedRequest, scopedUserTenantId ?? ""),
    enabled: Boolean(scopedUserTenantId),
  });

  const auditLogsQuery = useQuery({
    queryKey: [
      "audit-logs",
      currentUser?.role,
      selectedTenantId,
      selectedAction,
      selectedActorId,
      offset,
      AUDIT_PAGE_SIZE,
    ],
    queryFn: async () => {
      const filters = {
        action: selectedAction === "all" ? undefined : selectedAction,
        actorUserId: selectedActorId || undefined,
        tenantId: currentUser?.role === "SYS_ADMIN" && selectedTenantId ? selectedTenantId : undefined,
        limit: AUDIT_PAGE_SIZE,
        offset,
      };

      if (currentUser?.role === "SYS_ADMIN") {
        return listSystemAuditLogs(authenticatedRequest, filters);
      }

      return listTenantAuditLogs(authenticatedRequest, currentTenant?.id ?? "", filters);
    },
    enabled: Boolean(currentUser && (currentUser.role === "SYS_ADMIN" || currentTenant?.id)),
  });

  const actorOptions = useMemo(() => {
    const actorMap = new Map<string, { id: string; label: string }>();

    (scopedUsersQuery.data ?? []).forEach((managedUser) => {
      actorMap.set(managedUser.id, {
        id: managedUser.id,
        label: `${managedUser.fullName} (${managedUser.email})`,
      });
    });

    (auditLogsQuery.data?.items ?? []).forEach((item) => {
      if (!item.actor) {
        return;
      }

      actorMap.set(item.actor.id, {
        id: item.actor.id,
        label: buildActorLabel(item.actor),
      });
    });

    return Array.from(actorMap.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [auditLogsQuery.data?.items, scopedUsersQuery.data]);
  const actorSelectOptions =
    selectedActorId && !actorOptions.some((actorOption) => actorOption.id === selectedActorId)
      ? [{ id: selectedActorId, label: "Selected actor" }, ...actorOptions]
      : actorOptions;

  if (!currentUser || !currentTenant) {
    return null;
  }

  const isGlobalSystemView = currentUser.role === "SYS_ADMIN" && selectedTenantId.length === 0;
  const totalItems = auditLogsQuery.data?.total ?? 0;
  const pageStart = totalItems === 0 ? 0 : offset + 1;
  const pageEnd = totalItems === 0 ? 0 : Math.min(offset + AUDIT_PAGE_SIZE, totalItems);
  const items = auditLogsQuery.data?.items ?? [];
  const canGoBack = offset > 0;
  const canGoForward = offset + AUDIT_PAGE_SIZE < totalItems;

  return (
    <>
      <PageHeader
        eyebrow="Audit Logs"
        title={
          currentUser.role === "SYS_ADMIN"
            ? "Inspect platform and tenant activity"
            : "Inspect tenant activity and security events"
        }
        description="This audit viewer is wired to the IAM backend with role-aware scope, action filtering, actor filtering, and paginated event history."
        actions={
          <>
            <StatusPill tone="accent">Live Audit Feed</StatusPill>
            <StatusPill tone={currentUser.role === "SYS_ADMIN" ? "warning" : "success"}>
              {isGlobalSystemView ? "Global Scope" : "Scoped View"}
            </StatusPill>
          </>
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Events In Scope"
          value={auditLogsQuery.isPending ? "..." : String(totalItems)}
          note="Total matching events returned by the IAM audit endpoint."
        />
        <StatCard
          label="Current Window"
          value={auditLogsQuery.isPending ? "..." : `${pageStart}-${pageEnd}`}
          note="Current paginated slice of the matching event stream."
        />
        <StatCard
          label="Scope"
          value={formatScopeLabel(selectedTenant, isGlobalSystemView)}
          note="System admins can stay global or narrow to a single tenant."
        />
      </div>

      <div className="content-grid">
        <div className="stack">
          <SurfaceCard>
            <div className="toolbar toolbar-wrap">
              <select
                className="select"
                value={selectedAction}
                onChange={(event) => setSelectedAction(event.target.value as "all" | AuditAction)}
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={selectedActorId}
                onChange={(event) => setSelectedActorId(event.target.value)}
                disabled={actorSelectOptions.length === 0 && selectedActorId.length === 0}
              >
                <option value="">All actors</option>
                {actorSelectOptions.map((actorOption) => (
                  <option key={actorOption.id} value={actorOption.id}>
                    {actorOption.label}
                  </option>
                ))}
              </select>

              {currentUser.role === "SYS_ADMIN" ? (
                <select
                  className="select"
                  value={selectedTenantId}
                  onChange={(event) => setSelectedTenantId(event.target.value)}
                  disabled={tenantsQuery.isPending}
                >
                  <option value="">All tenants</option>
                  {tenantsQuery.data?.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
              ) : null}

              <button
                className="button button-secondary"
                type="button"
                onClick={() => void auditLogsQuery.refetch()}
                disabled={auditLogsQuery.isFetching}
              >
                {auditLogsQuery.isFetching ? "Refreshing..." : "Refresh events"}
              </button>
            </div>
          </SurfaceCard>

          {tenantsQuery.isError ? (
            <div className="alert alert-warning" role="status">
              {tenantsQuery.error instanceof Error
                ? tenantsQuery.error.message
                : "The tenant scope list could not be loaded."}
            </div>
          ) : null}

          {scopedUsersQuery.isError ? (
            <div className="alert alert-warning" role="status">
              Actor options are limited to the current event page because the scoped user list could not
              be loaded.
            </div>
          ) : null}

          <div className="info-banner">
            <strong>Supported backend filters</strong>
            <p>
              Action, actor, tenant, and pagination are live. Date-range filtering is not exposed by the
              current IAM audit API yet, so it is intentionally not faked in the UI.
            </p>
          </div>

          {auditLogsQuery.isPending ? (
            <SurfaceCard>
              <div className="stack">
                <h3>Loading audit events</h3>
                <p className="helper-text">
                  The portal is fetching the current event stream from the IAM backend.
                </p>
              </div>
            </SurfaceCard>
          ) : auditLogsQuery.isError ? (
            <SurfaceCard>
              <div className="stack">
                <h3>Audit log feed unavailable</h3>
                <p className="helper-text">
                  {auditLogsQuery.error instanceof Error
                    ? auditLogsQuery.error.message
                    : "The IAM service could not return audit events for the current scope."}
                </p>
                <div className="split-actions">
                  <button className="button button-primary" type="button" onClick={() => void auditLogsQuery.refetch()}>
                    Retry audit feed
                  </button>
                </div>
              </div>
            </SurfaceCard>
          ) : items.length === 0 ? (
            <SurfaceCard>
              <div className="stack">
                <h3>No audit events match the current filters</h3>
                <p className="helper-text">
                  Adjust the scope, action, or actor filter to broaden the current result set.
                </p>
              </div>
            </SurfaceCard>
          ) : (
            <>
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Scope</th>
                      <th>Resource</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>{formatTimestamp(item.createdAt)}</td>
                        <td>
                          <div className="stack stack-tight">
                            <strong>{item.actor?.fullName ?? "System"}</strong>
                            <span className="helper-text">{item.actor?.email ?? "No actor identity"}</span>
                          </div>
                        </td>
                        <td>
                          <StatusPill tone="accent">{item.action}</StatusPill>
                        </td>
                        <td>
                          <div className="stack stack-tight">
                            <strong>{item.tenant?.name ?? "No tenant"}</strong>
                            <span className="helper-text">{item.tenant?.slug ?? "system scope"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="stack stack-tight">
                            <strong>{item.resourceType}</strong>
                            <span className="helper-text">{item.resourceId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="stack stack-tight">
                            <span>{summarizeDetails(item)}</span>
                            {item.ipAddress || item.userAgent ? (
                              <span className="helper-text">
                                {[item.ipAddress, item.userAgent].filter(Boolean).join(" | ")}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <SurfaceCard>
                <div className="toolbar pagination-bar">
                  <div className="stack stack-tight">
                    <strong>
                      Showing {pageStart}-{pageEnd} of {totalItems}
                    </strong>
                    <span className="helper-text">
                      Results are paginated directly by the backend audit endpoint.
                    </span>
                  </div>

                  <div className="table-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => setOffset((currentOffset) => Math.max(0, currentOffset - AUDIT_PAGE_SIZE))}
                      disabled={!canGoBack || auditLogsQuery.isFetching}
                    >
                      Previous
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => setOffset((currentOffset) => currentOffset + AUDIT_PAGE_SIZE)}
                      disabled={!canGoForward || auditLogsQuery.isFetching}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </SurfaceCard>
            </>
          )}
        </div>

        <div className="stack">
          <SurfaceCard>
            <div className="stack">
              <p className="eyebrow">Filter Surface</p>
              <h3>Current review controls</h3>
              <ul className="feature-list">
                <li>
                  <span className="metric-label">Action filter</span>
                  <strong>Live</strong>
                </li>
                <li>
                  <span className="metric-label">Actor filter</span>
                  <strong>Live</strong>
                </li>
                <li>
                  <span className="metric-label">Tenant scope</span>
                  <strong>{currentUser.role === "SYS_ADMIN" ? "Live" : "Fixed by role"}</strong>
                </li>
              </ul>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="stack">
              <p className="eyebrow">Known Gap</p>
              <h3>Date-range filtering is pending backend support</h3>
              <p className="helper-text">
                The PRD calls for date-range filtering, but the current IAM audit API does not expose
                `from` or `to` parameters. Adding those controls now would produce misleading partial
                results, so the UI surfaces the gap instead.
              </p>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </>
  );
}
