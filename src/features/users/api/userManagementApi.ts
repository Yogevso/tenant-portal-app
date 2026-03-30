import type { ApiRequestOptions } from "../../../lib/api/client";
import type { Role } from "../../../types/auth";
import type { TenantRecord } from "../../../types/tenants";
import type { CreateManagedUserPayload, ManagedUser } from "../../../types/users";

type AuthenticatedRequest = <T>(
  path: string,
  options?: Omit<ApiRequestOptions, "accessToken">,
) => Promise<T>;

interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface ManagedUserResponse {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

function mapTenant(tenant: TenantResponse): TenantRecord {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    isActive: tenant.is_active,
  };
}

function mapManagedUser(user: ManagedUserResponse): ManagedUser {
  return {
    id: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: user.is_active,
  };
}

export async function listTenants(authenticatedRequest: AuthenticatedRequest) {
  const response = await authenticatedRequest<TenantResponse[]>("/tenants");
  return response.map(mapTenant);
}

export async function listManagedUsers(
  authenticatedRequest: AuthenticatedRequest,
  tenantId: string,
) {
  const response = await authenticatedRequest<ManagedUserResponse[]>(`/tenants/${tenantId}/users`);
  return response.map(mapManagedUser);
}

export async function createManagedUser(
  authenticatedRequest: AuthenticatedRequest,
  tenantId: string,
  payload: CreateManagedUserPayload,
) {
  const response = await authenticatedRequest<ManagedUserResponse>(`/tenants/${tenantId}/users`, {
    method: "POST",
    body: {
      email: payload.email,
      full_name: payload.fullName,
      password: payload.password,
      role: payload.role,
      is_active: payload.isActive,
    },
  });

  return mapManagedUser(response);
}

export async function updateManagedUserRole(
  authenticatedRequest: AuthenticatedRequest,
  tenantId: string,
  userId: string,
  role: Role,
) {
  const response = await authenticatedRequest<ManagedUserResponse>(
    `/tenants/${tenantId}/users/${userId}/role`,
    {
      method: "PATCH",
      body: { role },
    },
  );

  return mapManagedUser(response);
}

export async function deactivateManagedUser(
  authenticatedRequest: AuthenticatedRequest,
  tenantId: string,
  userId: string,
) {
  await authenticatedRequest<void>(`/tenants/${tenantId}/users/${userId}`, {
    method: "DELETE",
  });
}
