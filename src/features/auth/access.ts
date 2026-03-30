import type { Role } from "../../types/auth";

export const ADMIN_ROLES: Role[] = ["SYS_ADMIN", "TENANT_ADMIN"];

export function getRoleTone(role: Role) {
  if (role === "SYS_ADMIN") {
    return "warning" as const;
  }

  if (role === "TENANT_ADMIN") {
    return "accent" as const;
  }

  return "neutral" as const;
}
