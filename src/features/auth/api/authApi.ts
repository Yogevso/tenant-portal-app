import { apiRequest } from "../../../lib/api/client";
import type {
  AuthSession,
  Role,
  SessionUser,
  SystemAdminSummary,
  TenantAdminSummary,
  TenantContext,
} from "../../../types/auth";

interface AuthTenantResponse {
  id: string;
  name: string;
  slug: string;
}

interface AuthUserResponse {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_in: number;
  user: AuthUserResponse;
  tenant: AuthTenantResponse;
}

interface TenantAdminSummaryResponse {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  total_users: number;
  active_users: number;
  tenant_admins: number;
  standard_users: number;
}

interface SystemAdminSummaryResponse {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  system_admins: number;
  tenant_admins: number;
  standard_users: number;
}

export interface LoginPayload {
  tenantSlug: string;
  email: string;
  password: string;
}

function mapTenant(tenant: AuthTenantResponse): TenantContext {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
  };
}

function mapUser(user: AuthUserResponse): SessionUser {
  return {
    id: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: user.is_active,
  };
}

function mapAuthSession(response: AuthTokensResponse): AuthSession {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    accessTokenExpiresIn: response.access_token_expires_in,
    user: mapUser(response.user),
    tenant: mapTenant(response.tenant),
  };
}

export async function loginRequest(payload: LoginPayload) {
  const response = await apiRequest<AuthTokensResponse>("/auth/login", {
    method: "POST",
    body: {
      tenant_slug: payload.tenantSlug,
      email: payload.email,
      password: payload.password,
    },
  });

  return mapAuthSession(response);
}

export async function refreshRequest(refreshToken: string) {
  const response = await apiRequest<AuthTokensResponse>("/auth/refresh", {
    method: "POST",
    body: {
      refresh_token: refreshToken,
    },
  });

  return mapAuthSession(response);
}

export async function logoutRequest(refreshToken: string) {
  await apiRequest<void>("/auth/logout", {
    method: "POST",
    body: {
      refresh_token: refreshToken,
    },
  });
}

export async function getTenantAdminSummary(accessToken: string) {
  const response = await apiRequest<TenantAdminSummaryResponse>("/admin/tenant/summary", {
    accessToken,
  });

  const summary: TenantAdminSummary = {
    tenantId: response.tenant_id,
    tenantName: response.tenant_name,
    tenantSlug: response.tenant_slug,
    totalUsers: response.total_users,
    activeUsers: response.active_users,
    tenantAdmins: response.tenant_admins,
    standardUsers: response.standard_users,
  };

  return summary;
}

export async function getSystemAdminSummary(accessToken: string) {
  const response = await apiRequest<SystemAdminSummaryResponse>("/admin/system/summary", {
    accessToken,
  });

  const summary: SystemAdminSummary = {
    totalTenants: response.total_tenants,
    activeTenants: response.active_tenants,
    totalUsers: response.total_users,
    systemAdmins: response.system_admins,
    tenantAdmins: response.tenant_admins,
    standardUsers: response.standard_users,
  };

  return summary;
}
