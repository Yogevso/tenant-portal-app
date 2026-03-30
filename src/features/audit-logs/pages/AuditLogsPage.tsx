import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { InlineAlert } from "../../../components/ui/InlineAlert";
import { PageHeader } from "../../../components/ui/PageHeader";
import { AuditTableSkeleton, StatCardSkeleton } from "../../../components/ui/Skeleton";
import { StatCard } from "../../../components/ui/StatCard";
import { StatePanel } from "../../../components/ui/StatePanel";
import { StatusPill, type StatusTone } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import type { Role } from "../../../types/auth";
import type { AuditAction, AuditActor, AuditLogItem } from "../../../types/audit";
import type { TenantRecord } from "../../../types/tenants";
import { useAuth } from "../../auth/context/useAuth";
import { listManagedUsers, listTenants } from "../../users/api/userManagementApi";
import { listSystemAuditLogs, listTenantAuditLogs } from "../api/auditApi";

const AUDIT_PAGE_SIZE = 20;
const DEFAULT_AUDIT_TOOLBAR_HEIGHT = 184;

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

const auditActionValues: AuditAction[] = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "USER_CREATED",
  "USER_DEACTIVATED",
  "ROLE_CHANGED",
  "TOKEN_REVOKED",
  "TENANT_CREATED",
  "TENANT_UPDATED",
];

const auditReviewControls = [
  { label: "Action filter", value: "URL-synced" },
  { label: "Actor filter", value: "URL-synced" },
  { label: "Tenant scope", value: "Role-aware" },
] as const;

function isAuditAction(value: string | null): value is AuditAction {
  return auditActionValues.some((action) => action === value);
}

function parsePageValue(value: string | null) {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function setQueryParam(next: URLSearchParams, key: string, value: string | null | undefined) {
  const normalizedValue = value?.trim();

  if (normalizedValue) {
    next.set(key, normalizedValue);
    return;
  }

  next.delete(key);
}

function normalizeAuditSearchParams(
  currentParams: URLSearchParams,
  role: Role | undefined,
  mutate: (next: URLSearchParams) => void,
) {
  const next = new URLSearchParams(currentParams);

  mutate(next);

  const action = next.get("action");

  if (!isAuditAction(action)) {
    next.delete("action");
  }

  const actor = next.get("actor")?.trim();

  if (actor) {
    next.set("actor", actor);
  } else {
    next.delete("actor");
  }

  if (role === "SYS_ADMIN") {
    const tenant = next.get("tenant")?.trim();

    if (tenant) {
      next.set("tenant", tenant);
    } else {
      next.delete("tenant");
    }
  } else {
    next.delete("tenant");
  }

  const page = next.get("page");

  if (!page) {
    next.delete("page");
    return next;
  }

  const parsedPage = parsePageValue(page);

  if (parsedPage <= 1 || String(parsedPage) !== page) {
    next.delete("page");
  }

  return next;
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
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

function formatActionLabel(action: AuditAction) {
  return action
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getAuditActionTone(action: AuditAction): StatusTone {
  switch (action) {
    case "LOGIN_SUCCESS":
    case "USER_CREATED":
    case "TENANT_CREATED":
      return "success";
    case "LOGIN_FAILURE":
      return "danger";
    case "TOKEN_REVOKED":
    case "USER_DEACTIVATED":
      return "warning";
    case "ROLE_CHANGED":
    case "TENANT_UPDATED":
      return "accent";
    default:
      return "neutral";
  }
}

function formatDetailKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortenValue(value: string, options: { start: number; end: number }) {
  const normalized = value.trim();

  if (normalized.length <= options.start + options.end + 3) {
    return normalized;
  }

  return `${normalized.slice(0, options.start)}...${normalized.slice(-options.end)}`;
}

function getDetailEntries(item: AuditLogItem) {
  const detailEntries = Object.entries(item.details ?? {});

  if (detailEntries.length === 0) {
    return [
      {
        key: "Event",
        value: `${item.resourceType}:${item.resourceId}`,
      },
    ];
  }

  return detailEntries.slice(0, 2).map(([key, value]) => ({
    key: formatDetailKey(key),
    value: String(value),
  }));
}

function formatUserAgent(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .replace(/\s+/g, " ")
    .replace(/^Mozilla\/5\.0\s*/, "")
    .trim();
}

function getResourceLabel(item: AuditLogItem) {
  return shortenValue(item.resourceId, { start: 8, end: 6 });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function AuditLogsPage() {
  const { authenticatedRequest, tenant: currentTenant, user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toolbarHeight, setToolbarHeight] = useState(DEFAULT_AUDIT_TOOLBAR_HEIGHT);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const rawActionParam = searchParams.get("action");
  const rawActorParam = searchParams.get("actor");
  const rawTenantParam = searchParams.get("tenant");
  const rawPageParam = searchParams.get("page");
  const selectedAction = isAuditAction(rawActionParam) ? rawActionParam : "all";
  const selectedActorId = rawActorParam?.trim() ?? "";
  const requestedTenantId = rawTenantParam?.trim() ?? "";
  const selectedTenantId =
    currentUser?.role === "SYS_ADMIN" ? requestedTenantId : (currentTenant?.id ?? "");
  const currentPage = parsePageValue(rawPageParam);
  const offset = (currentPage - 1) * AUDIT_PAGE_SIZE;

  const auditStickyStyles = {
    "--audit-table-header-offset": `${toolbarHeight + 28}px`,
  } as CSSProperties;

  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: () => listTenants(authenticatedRequest),
    enabled: currentUser?.role === "SYS_ADMIN",
  });

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
      currentPage,
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

  useEffect(() => {
    if (!toolbarRef.current) {
      return;
    }

    function updateToolbarHeight() {
      const toolbarNode = toolbarRef.current;

      if (!toolbarNode) {
        return;
      }

      const nextHeight = Math.ceil(toolbarNode.getBoundingClientRect().height);

      if (nextHeight > 0) {
        setToolbarHeight(nextHeight);
      }
    }

    updateToolbarHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => updateToolbarHeight());
    observer.observe(toolbarRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hasInvalidAction = rawActionParam !== null && !isAuditAction(rawActionParam);
    const parsedPage = parsePageValue(rawPageParam);
    const hasInvalidPage = rawPageParam !== null && (parsedPage <= 1 || String(parsedPage) !== rawPageParam);

    if (!hasInvalidAction && !hasInvalidPage) {
      return;
    }

    setSearchParams(
      (currentParams) =>
        normalizeAuditSearchParams(currentParams, currentUser?.role, (next) => {
          if (hasInvalidAction) {
            next.delete("action");
          }

          if (hasInvalidPage) {
            next.delete("page");
          }
        }),
      { replace: true },
    );
  }, [currentUser?.role, rawActionParam, rawPageParam, setSearchParams]);

  useEffect(() => {
    if (currentUser?.role === "SYS_ADMIN" || rawTenantParam === null) {
      return;
    }

    setSearchParams(
      (currentParams) =>
        normalizeAuditSearchParams(currentParams, currentUser?.role, (next) => {
          next.delete("tenant");
        }),
      { replace: true },
    );
  }, [currentUser?.role, rawTenantParam, setSearchParams]);

  useEffect(() => {
    if (currentUser?.role !== "SYS_ADMIN" || !requestedTenantId || !tenantsQuery.isSuccess) {
      return;
    }

    const tenantExists = tenantsQuery.data.some((tenant) => tenant.id === requestedTenantId);

    if (tenantExists) {
      return;
    }

    setSearchParams(
      (currentParams) =>
        normalizeAuditSearchParams(currentParams, currentUser.role, (next) => {
          next.delete("tenant");
          next.delete("actor");
          next.delete("page");
        }),
      { replace: true },
    );
  }, [currentUser?.role, requestedTenantId, setSearchParams, tenantsQuery.data, tenantsQuery.isSuccess]);

  useEffect(() => {
    if (!auditLogsQuery.isSuccess) {
      return;
    }

    const totalPages = Math.max(1, Math.ceil(auditLogsQuery.data.total / AUDIT_PAGE_SIZE));

    if (currentPage <= totalPages) {
      return;
    }

    setSearchParams(
      (currentParams) =>
        normalizeAuditSearchParams(currentParams, currentUser?.role, (next) => {
          if (totalPages <= 1) {
            next.delete("page");
            return;
          }

          next.set("page", String(totalPages));
        }),
      { replace: true },
    );
  }, [auditLogsQuery.data, auditLogsQuery.isSuccess, currentPage, currentUser?.role, setSearchParams]);

  function updateAuditSearchParams(
    mutate: (next: URLSearchParams) => void,
    options: { replace?: boolean } = {},
  ) {
    setSearchParams(
      (currentParams) => normalizeAuditSearchParams(currentParams, currentUser?.role, mutate),
      options,
    );
  }

  function goToPage(nextPage: number) {
    updateAuditSearchParams((next) => {
      if (nextPage <= 1) {
        next.delete("page");
        return;
      }

      next.set("page", String(nextPage));
    });
  }

  if (!currentUser || !currentTenant) {
    return null;
  }

  const isGlobalSystemView = currentUser.role === "SYS_ADMIN" && selectedTenantId.length === 0;
  const totalItems = auditLogsQuery.data?.total ?? 0;
  const pageStart = totalItems === 0 ? 0 : offset + 1;
  const pageEnd = totalItems === 0 ? 0 : Math.min(offset + AUDIT_PAGE_SIZE, totalItems);
  const items = auditLogsQuery.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(totalItems / AUDIT_PAGE_SIZE));
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  return (
    <>
      <PageHeader
        eyebrow="Audit Logs"
        title={
          currentUser.role === "SYS_ADMIN"
            ? "Inspect platform and tenant activity"
            : "Inspect tenant activity and security events"
        }
        description="This audit viewer is wired to the IAM backend with role-aware scope, action filtering, actor filtering, paginated event history, and shareable URL-backed filters."
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
        {auditLogsQuery.isPending ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Events In Scope"
              value={String(totalItems)}
              note="Total matching events returned by the IAM audit endpoint."
            />
            <StatCard
              label="Current Window"
              value={`${pageStart}-${pageEnd}`}
              note="Current paginated slice of the matching event stream."
            />
            <StatCard
              label="Scope"
              value={formatScopeLabel(selectedTenant, isGlobalSystemView)}
              note="System admins can stay global or narrow to a single tenant."
            />
          </>
        )}
      </div>

      <div className="audit-page-stack" style={auditStickyStyles}>
        <div className="audit-toolbar-sticky" ref={toolbarRef}>
          <SurfaceCard className="audit-toolbar-card">
            <div className="audit-toolbar-header">
              <div className="stack">
                <p className="eyebrow">Review Filters</p>
                <h3>Refine the live event stream</h3>
                <p className="helper-text">
                  Adjust action, actor, tenant scope, and backend pagination without leaving the page.
                </p>
              </div>

              <StatusPill tone="accent">
                {isGlobalSystemView ? "System-wide query" : "Tenant-scoped query"}
              </StatusPill>
            </div>

            <div className="audit-filter-grid">
              <label className="audit-filter-field">
                <span className="audit-filter-label">Action</span>
                <select
                  aria-label="Filter audit events by action"
                  className="select"
                  value={selectedAction}
                  onChange={(event) => {
                    updateAuditSearchParams((next) => {
                      setQueryParam(next, "action", event.target.value === "all" ? null : event.target.value);
                      next.delete("page");
                    });
                  }}
                >
                  {actionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="audit-filter-field">
                <span className="audit-filter-label">Actor</span>
                <select
                  aria-label="Filter audit events by actor"
                  className="select"
                  value={selectedActorId}
                  onChange={(event) => {
                    updateAuditSearchParams((next) => {
                      setQueryParam(next, "actor", event.target.value);
                      next.delete("page");
                    });
                  }}
                  disabled={actorSelectOptions.length === 0 && selectedActorId.length === 0}
                >
                  <option value="">All actors</option>
                  {actorSelectOptions.map((actorOption) => (
                    <option key={actorOption.id} value={actorOption.id}>
                      {actorOption.label}
                    </option>
                  ))}
                </select>
              </label>

              {currentUser.role === "SYS_ADMIN" ? (
                <label className="audit-filter-field">
                  <span className="audit-filter-label">Tenant scope</span>
                  <select
                    aria-label="Filter audit events by tenant scope"
                    className="select"
                    value={selectedTenantId}
                    onChange={(event) => {
                      updateAuditSearchParams((next) => {
                        setQueryParam(next, "tenant", event.target.value);
                        next.delete("actor");
                        next.delete("page");
                      });
                    }}
                    disabled={tenantsQuery.isPending}
                  >
                    <option value="">All tenants</option>
                    {tenantsQuery.data?.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.slug})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="audit-filter-actions">
                <button
                  aria-busy={auditLogsQuery.isFetching}
                  className="button button-secondary"
                  type="button"
                  onClick={() => void auditLogsQuery.refetch()}
                  disabled={auditLogsQuery.isFetching}
                >
                  {auditLogsQuery.isFetching ? "Refreshing..." : "Refresh events"}
                </button>
              </div>
            </div>
          </SurfaceCard>
        </div>

        {tenantsQuery.isError ? (
          <InlineAlert tone="warning" title="Tenant scopes unavailable">
            {getErrorMessage(tenantsQuery.error, "The tenant scope list could not be loaded.")}
          </InlineAlert>
        ) : null}

        {scopedUsersQuery.isError ? (
          <InlineAlert tone="warning" title="Actor options limited">
            Actor options are limited to the current event page because the scoped user list could not
            be loaded.
          </InlineAlert>
        ) : null}

        <InlineAlert tone="info" title="Supported backend filters">
          Action, actor, tenant, and pagination are live. Date-range filtering is not exposed by the
          current IAM audit API yet, so it is intentionally not faked in the UI.
        </InlineAlert>

        {auditLogsQuery.isPending ? (
          <AuditTableSkeleton />
        ) : auditLogsQuery.isError ? (
          <StatePanel
            eyebrow="Sync Error"
            tone="warning"
            title="Audit log feed unavailable"
            description={getErrorMessage(
              auditLogsQuery.error,
              "The IAM service could not return audit events for the current scope.",
            )}
            actions={
              <button className="button button-primary" type="button" onClick={() => void auditLogsQuery.refetch()}>
                Retry audit feed
              </button>
            }
          />
        ) : items.length === 0 ? (
          <StatePanel
            eyebrow="Empty State"
            tone="neutral"
            title="No audit events match the current filters"
            description="Adjust the scope, action, or actor filter to broaden the current result set."
          />
        ) : (
          <>
            <div className="table-shell audit-table-shell">
              <table className="data-table audit-data-table">
                <colgroup>
                  <col className="audit-col-timestamp" />
                  <col className="audit-col-actor" />
                  <col className="audit-col-action" />
                  <col className="audit-col-scope" />
                  <col className="audit-col-resource" />
                  <col className="audit-col-details" />
                </colgroup>
                <caption className="sr-only">Audit events in the current scope</caption>
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
                  {items.map((item) => {
                    const timestamp = formatTimestamp(item.createdAt);
                    const detailEntries = getDetailEntries(item);
                    const userAgent = formatUserAgent(item.userAgent);

                    return (
                      <tr key={item.id}>
                        <td data-label="Timestamp">
                          <time className="audit-timestamp" dateTime={item.createdAt}>
                            <strong>{timestamp.date}</strong>
                            <span className="helper-text">{timestamp.time}</span>
                          </time>
                        </td>
                        <td data-label="Actor">
                          <div className="stack stack-tight">
                            <strong>{item.actor?.fullName ?? "System"}</strong>
                            <span className="helper-text">{item.actor?.email ?? "No actor identity"}</span>
                          </div>
                        </td>
                        <td data-label="Action">
                          <StatusPill tone={getAuditActionTone(item.action)}>{formatActionLabel(item.action)}</StatusPill>
                        </td>
                        <td data-label="Scope">
                          <div className="stack stack-tight">
                            <strong>{item.tenant?.name ?? "No tenant"}</strong>
                            <span className="helper-text">{item.tenant?.slug ?? "system scope"}</span>
                          </div>
                        </td>
                        <td data-label="Resource">
                          <div className="stack stack-tight audit-resource-cell">
                            <strong>{item.resourceType}</strong>
                            <code className="audit-code" title={item.resourceId}>
                              {getResourceLabel(item)}
                            </code>
                          </div>
                        </td>
                        <td data-label="Details">
                          <div className="audit-detail-list">
                            {detailEntries.map((entry) => (
                              <div key={`${item.id}-${entry.key}`} className="audit-detail-row">
                                <span className="audit-detail-key">{entry.key}</span>
                                <span className="audit-detail-value" title={entry.value}>
                                  {entry.value}
                                </span>
                              </div>
                            ))}

                            {item.ipAddress ? (
                              <span className="helper-text audit-detail-meta" title={item.ipAddress}>
                                IP: {item.ipAddress}
                              </span>
                            ) : null}

                            {userAgent ? (
                              <span className="helper-text audit-detail-meta" title={item.userAgent ?? undefined}>
                                UA: {userAgent}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                    Page {currentPage} of {totalPages}. Results are paginated directly by the backend
                    audit endpoint.
                  </span>
                </div>

                <div className="table-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={!canGoBack || auditLogsQuery.isFetching}
                  >
                    Previous
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={!canGoForward || auditLogsQuery.isFetching}
                  >
                    Next
                  </button>
                </div>
              </div>
            </SurfaceCard>
          </>
        )}

        <div className="audit-insight-grid">
          <SurfaceCard>
            <div className="stack">
              <p className="eyebrow">Review Controls</p>
              <h3>Current review surface</h3>
              <ul className="feature-list">
                {auditReviewControls.map((item) => (
                  <li key={item.label}>
                    <span className="metric-label">{item.label}</span>
                    <strong>
                      {item.label === "Tenant scope" && currentUser.role !== "SYS_ADMIN" ? "Fixed by role" : item.value}
                    </strong>
                  </li>
                ))}
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
