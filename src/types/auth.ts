export type Role = "SYS_ADMIN" | "TENANT_ADMIN" | "USER";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  tenantId: string;
  tenantName: string;
}
