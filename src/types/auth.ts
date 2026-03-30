export type Role = "SYS_ADMIN" | "TENANT_ADMIN" | "USER";

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  tenantId: string;
  isActive: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
  user: SessionUser;
  tenant: TenantContext;
}

export interface TenantAdminSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  totalUsers: number;
  activeUsers: number;
  tenantAdmins: number;
  standardUsers: number;
}

export interface SystemAdminSummary {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  systemAdmins: number;
  tenantAdmins: number;
  standardUsers: number;
}
