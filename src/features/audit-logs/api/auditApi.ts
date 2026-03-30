import type { ApiRequestOptions } from "../../../lib/api/client";
import type { AuditAction, AuditActor, AuditLogItem, AuditLogListResult, AuditTenant } from "../../../types/audit";

type AuthenticatedRequest = <T>(
  path: string,
  options?: Omit<ApiRequestOptions, "accessToken">,
) => Promise<T>;

interface AuditActorResponse {
  id: string;
  email: string;
  full_name: string;
  role: AuditActor["role"];
}

interface AuditTenantResponse {
  id: string;
  name: string;
  slug: string;
}

interface AuditLogResponse {
  id: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  tenant: AuditTenantResponse | null;
  actor: AuditActorResponse | null;
}

interface AuditLogListResponse {
  items: AuditLogResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditListFilters {
  action?: AuditAction;
  actorUserId?: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
}

function mapActor(actor: AuditActorResponse): AuditActor {
  return {
    id: actor.id,
    email: actor.email,
    fullName: actor.full_name,
    role: actor.role,
  };
}

function mapTenant(tenant: AuditTenantResponse): AuditTenant {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
  };
}

function mapAuditLogItem(item: AuditLogResponse): AuditLogItem {
  return {
    id: item.id,
    action: item.action,
    resourceType: item.resource_type,
    resourceId: item.resource_id,
    details: item.details,
    ipAddress: item.ip_address,
    userAgent: item.user_agent,
    createdAt: item.created_at,
    tenant: item.tenant ? mapTenant(item.tenant) : null,
    actor: item.actor ? mapActor(item.actor) : null,
  };
}

function mapAuditListResult(response: AuditLogListResponse): AuditLogListResult {
  return {
    items: response.items.map(mapAuditLogItem),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  };
}

function buildAuditQuery(filters: AuditListFilters) {
  const searchParams = new URLSearchParams();

  if (filters.action) {
    searchParams.set("action", filters.action);
  }

  if (filters.actorUserId) {
    searchParams.set("actor_user_id", filters.actorUserId);
  }

  if (filters.tenantId) {
    searchParams.set("tenant_id", filters.tenantId);
  }

  if (filters.limit) {
    searchParams.set("limit", String(filters.limit));
  }

  if (filters.offset) {
    searchParams.set("offset", String(filters.offset));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export async function listSystemAuditLogs(
  authenticatedRequest: AuthenticatedRequest,
  filters: AuditListFilters,
) {
  const response = await authenticatedRequest<AuditLogListResponse>(
    `/audit-logs${buildAuditQuery(filters)}`,
  );

  return mapAuditListResult(response);
}

export async function listTenantAuditLogs(
  authenticatedRequest: AuthenticatedRequest,
  tenantId: string,
  filters: AuditListFilters,
) {
  const response = await authenticatedRequest<AuditLogListResponse>(
    `/tenants/${tenantId}/audit-logs${buildAuditQuery(filters)}`,
  );

  return mapAuditListResult(response);
}
