import type { Role } from "./auth";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "USER_CREATED"
  | "USER_DEACTIVATED"
  | "ROLE_CHANGED"
  | "TOKEN_REVOKED"
  | "TENANT_CREATED"
  | "TENANT_UPDATED";

export interface AuditActor {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuditTenant {
  id: string;
  name: string;
  slug: string;
}

export interface AuditLogItem {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  tenant: AuditTenant | null;
  actor: AuditActor | null;
}

export interface AuditLogListResult {
  items: AuditLogItem[];
  total: number;
  limit: number;
  offset: number;
}
