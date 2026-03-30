import type { Role } from "./auth";

export interface ManagedUser {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface CreateManagedUserPayload {
  email: string;
  fullName: string;
  password: string;
  role: Role;
  isActive: boolean;
}
