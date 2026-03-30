import { describe, expect, it } from "vitest";

import { ADMIN_ROLES, getRoleTone } from "../src/features/auth/access";

describe("auth access helpers", () => {
  it("keeps the administrative roles scoped to system and tenant admins", () => {
    expect(ADMIN_ROLES).toEqual(["SYS_ADMIN", "TENANT_ADMIN"]);
  });

  it("maps each role to the expected UI tone", () => {
    expect(getRoleTone("SYS_ADMIN")).toBe("warning");
    expect(getRoleTone("TENANT_ADMIN")).toBe("accent");
    expect(getRoleTone("USER")).toBe("neutral");
  });
});
