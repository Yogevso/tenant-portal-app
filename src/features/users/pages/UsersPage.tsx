import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { InlineAlert } from "../../../components/ui/InlineAlert";
import { PageHeader } from "../../../components/ui/PageHeader";
import { UsersTableSkeleton } from "../../../components/ui/Skeleton";
import { StatePanel } from "../../../components/ui/StatePanel";
import { StatusPill } from "../../../components/ui/StatusPill";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { ApiError } from "../../../lib/api/client";
import type { Role } from "../../../types/auth";
import type { TenantRecord } from "../../../types/tenants";
import type { ManagedUser } from "../../../types/users";
import { getRoleTone } from "../../auth/access";
import { useAuth } from "../../auth/context/useAuth";
import {
  createManagedUser,
  deactivateManagedUser,
  listManagedUsers,
  listTenants,
  updateManagedUserRole,
} from "../api/userManagementApi";

const createUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["SYS_ADMIN", "TENANT_ADMIN", "USER"]),
  isActive: z.boolean(),
});

const defaultCreateUserValues = {
  email: "",
  fullName: "",
  password: "",
  role: "USER",
  isActive: true,
} as const;

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type RoleFilterValue = "all" | Role;
type NoticeTone = "success" | "warning" | "danger";

interface PageNotice {
  tone: NoticeTone;
  text: string;
}

function getAllowedRoleOptions(actorRole: Role) {
  if (actorRole === "SYS_ADMIN") {
    return ["USER", "TENANT_ADMIN", "SYS_ADMIN"] as const;
  }

  return ["USER", "TENANT_ADMIN"] as const;
}

function getStatusTone(isActive: boolean) {
  return isActive ? "success" : "warning";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { authenticatedRequest, tenant: currentTenant, user: currentUser } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState(currentTenant?.id ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("all");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, Role>>({});
  const [pageNotice, setPageNotice] = useState<PageNotice | null>(null);
  const roleOptions: Role[] = currentUser ? [...getAllowedRoleOptions(currentUser.role)] : [];
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreateUserFormValues>({
    defaultValues: defaultCreateUserValues,
    resolver: zodResolver(createUserSchema),
  });

  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: () => listTenants(authenticatedRequest),
    enabled: currentUser?.role === "SYS_ADMIN",
  });

  useEffect(() => {
    if (currentUser?.role !== "SYS_ADMIN") {
      setSelectedTenantId(currentTenant?.id ?? "");
    }
  }, [currentTenant?.id, currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role !== "SYS_ADMIN" || !tenantsQuery.data?.length) {
      return;
    }

    const tenantExists = tenantsQuery.data.some((tenant) => tenant.id === selectedTenantId);

    if (!selectedTenantId || !tenantExists) {
      const preferredTenant =
        tenantsQuery.data.find((tenant) => tenant.id === currentTenant?.id) ?? tenantsQuery.data[0];

      setSelectedTenantId(preferredTenant.id);
    }
  }, [currentTenant?.id, currentUser?.role, selectedTenantId, tenantsQuery.data]);

  useEffect(() => {
    setRoleDrafts({});
    setPageNotice(null);
    reset(defaultCreateUserValues);
  }, [reset, selectedTenantId]);

  const selectedTenant: TenantRecord | null =
    currentUser?.role === "SYS_ADMIN"
      ? tenantsQuery.data?.find((tenant) => tenant.id === selectedTenantId) ??
        (selectedTenantId === currentTenant?.id && currentTenant
          ? {
              id: currentTenant.id,
              name: currentTenant.name,
              slug: currentTenant.slug,
              isActive: true,
            }
          : null)
      : currentTenant
        ? {
            id: currentTenant.id,
            name: currentTenant.name,
            slug: currentTenant.slug,
            isActive: true,
          }
        : null;

  const usersQuery = useQuery({
    queryKey: ["managed-users", selectedTenantId],
    queryFn: () => listManagedUsers(authenticatedRequest, selectedTenantId),
    enabled: Boolean(selectedTenantId),
  });

  async function invalidateUserManagementState(tenantId: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["managed-users", tenantId] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
    ]);
  }

  const createUserMutation = useMutation({
    mutationFn: async (variables: { tenantId: string; values: CreateUserFormValues }) =>
      createManagedUser(authenticatedRequest, variables.tenantId, variables.values),
    onSuccess: async (createdUser, variables) => {
      reset(defaultCreateUserValues);
      setPageNotice({
        tone: "success",
        text: `${createdUser.fullName} was created successfully.`,
      });
      await invalidateUserManagementState(variables.tenantId);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "validation_error" && error.details) {
        const fieldMap: Record<string, keyof CreateUserFormValues> = {
          "body.email": "email",
          "body.full_name": "fullName",
          "body.password": "password",
          "body.role": "role",
          "body.is_active": "isActive",
        };

        error.details.forEach((detail) => {
          const fieldName = fieldMap[detail.field];

          if (fieldName) {
            setError(fieldName, {
              type: "server",
              message: detail.message,
            });
          }
        });
      }

      setPageNotice({
        tone: "danger",
        text: getErrorMessage(error, "The portal could not create the user."),
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (variables: { tenantId: string; userId: string; role: Role }) =>
      updateManagedUserRole(authenticatedRequest, variables.tenantId, variables.userId, variables.role),
    onSuccess: async (updatedUser, variables) => {
      setRoleDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[variables.userId];
        return nextDrafts;
      });
      setPageNotice({
        tone: "success",
        text: `${updatedUser.fullName} is now assigned to ${updatedUser.role}.`,
      });
      await invalidateUserManagementState(variables.tenantId);
    },
    onError: (error) => {
      setPageNotice({
        tone: "danger",
        text: getErrorMessage(error, "The role update could not be completed."),
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (variables: { tenantId: string; userId: string; fullName: string }) => {
      await deactivateManagedUser(authenticatedRequest, variables.tenantId, variables.userId);
      return variables;
    },
    onSuccess: async (variables) => {
      setPageNotice({
        tone: "success",
        text: `${variables.fullName} was deactivated and their refresh sessions were revoked.`,
      });
      await invalidateUserManagementState(variables.tenantId);
    },
    onError: (error) => {
      setPageNotice({
        tone: "danger",
        text: getErrorMessage(error, "The user could not be deactivated."),
      });
    },
  });

  if (!currentUser || !currentTenant) {
    return null;
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredUsers = (usersQuery.data ?? []).filter((managedUser) => {
    const matchesSearch =
      normalizedSearchTerm.length === 0 ||
      `${managedUser.fullName} ${managedUser.email}`.toLowerCase().includes(normalizedSearchTerm);
    const matchesRole = roleFilter === "all" || managedUser.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  function handleCreateUser(values: CreateUserFormValues) {
    if (!selectedTenantId) {
      return;
    }

    clearErrors();
    setPageNotice(null);
    createUserMutation.mutate({
      tenantId: selectedTenantId,
      values,
    });
  }

  function handleRoleDraftChange(userId: string, role: Role) {
    setPageNotice(null);
    setRoleDrafts((currentDrafts) => ({
      ...currentDrafts,
      [userId]: role,
    }));
  }

  function handleRoleSave(managedUser: ManagedUser) {
    const nextRole = roleDrafts[managedUser.id] ?? managedUser.role;

    if (nextRole === managedUser.role) {
      return;
    }

    setPageNotice(null);
    updateRoleMutation.mutate({
      tenantId: managedUser.tenantId,
      userId: managedUser.id,
      role: nextRole,
    });
  }

  function handleDeactivateUser(managedUser: ManagedUser) {
    if (managedUser.id === currentUser?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Deactivate ${managedUser.fullName}? This revokes active refresh sessions and prevents sign-in.`,
    );

    if (!confirmed) {
      return;
    }

    setPageNotice(null);
    deactivateUserMutation.mutate({
      tenantId: managedUser.tenantId,
      userId: managedUser.id,
      fullName: managedUser.fullName,
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="User Management"
        title={
          currentUser.role === "SYS_ADMIN"
            ? "Manage users across tenant scopes"
            : "Manage users inside your tenant"
        }
        description={
          currentUser.role === "SYS_ADMIN"
            ? "Select a tenant, review live users, and perform IAM-backed administration actions within that scope."
            : "Create users, adjust roles, and deactivate accounts inside your current tenant boundary."
        }
        actions={
          <>
            <StatusPill tone="accent">IAM Backed</StatusPill>
            {selectedTenant ? (
              <StatusPill tone={selectedTenant.isActive ? "success" : "warning"}>
                {selectedTenant.isActive ? "Tenant Active" : "Tenant Inactive"}
              </StatusPill>
            ) : null}
          </>
        }
      />

      <div className="content-grid">
        <div className="stack">
          <SurfaceCard>
            <div className="toolbar toolbar-wrap">
              <input
                aria-label="Search users by name or email"
                className="input"
                type="search"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <select
                aria-label="Filter users by role"
                className="select"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as RoleFilterValue)}
              >
                <option value="all">All roles</option>
                <option value="SYS_ADMIN">SYS_ADMIN</option>
                <option value="TENANT_ADMIN">TENANT_ADMIN</option>
                <option value="USER">USER</option>
              </select>

              {currentUser.role === "SYS_ADMIN" ? (
                <select
                  aria-label="Select tenant scope"
                  className="select"
                  value={selectedTenantId}
                  onChange={(event) => setSelectedTenantId(event.target.value)}
                  disabled={tenantsQuery.isPending || !tenantsQuery.data?.length}
                >
                  {tenantsQuery.data?.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
              ) : null}

              <button
                aria-busy={usersQuery.isFetching}
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setPageNotice(null);
                  void usersQuery.refetch();
                }}
                disabled={!selectedTenantId || usersQuery.isFetching}
              >
                {usersQuery.isFetching ? "Refreshing..." : "Refresh list"}
              </button>
            </div>
          </SurfaceCard>

          {tenantsQuery.isError ? (
            <InlineAlert tone="warning" title="Tenant list unavailable">
              {getErrorMessage(tenantsQuery.error, "The tenant list could not be loaded.")}
            </InlineAlert>
          ) : null}

          {pageNotice ? (
            <InlineAlert
              tone={pageNotice.tone === "danger" ? "danger" : pageNotice.tone}
              title={
                pageNotice.tone === "success"
                  ? "Update saved"
                  : pageNotice.tone === "warning"
                    ? "Heads up"
                    : "Request failed"
              }
            >
              {pageNotice.text}
            </InlineAlert>
          ) : null}

          <div className="info-banner">
            <strong>Live administrative scope</strong>
            <p>
              {selectedTenant
                ? `You are managing users in ${selectedTenant.name}. Role changes and deactivations are applied directly through the IAM backend.`
                : "Select a tenant scope to begin managing users."}
            </p>
          </div>

          {usersQuery.isPending ? (
            <UsersTableSkeleton />
          ) : usersQuery.isError ? (
            <StatePanel
              eyebrow="Sync Error"
              tone="warning"
              title="User list unavailable"
              description={getErrorMessage(
                usersQuery.error,
                "The IAM service could not return the current user list.",
              )}
              actions={
                <button className="button button-primary" type="button" onClick={() => void usersQuery.refetch()}>
                  Retry user list
                </button>
              }
            />
          ) : filteredUsers.length === 0 ? (
            <StatePanel
              eyebrow="Empty State"
              tone="neutral"
              title={usersQuery.data?.length ? "No users match the current filters" : "No users in scope yet"}
              description={
                usersQuery.data?.length
                  ? "Adjust the search or role filter to broaden the current result set."
                  : "Create the first user for this tenant from the form on the right."
              }
            />
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <caption className="sr-only">Users in the current tenant scope</caption>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((managedUser) => {
                    const draftRole = roleDrafts[managedUser.id] ?? managedUser.role;
                    const isRoleDirty = draftRole !== managedUser.role;
                    const isSavingRole =
                      updateRoleMutation.isPending && updateRoleMutation.variables?.userId === managedUser.id;
                    const isDeactivating =
                      deactivateUserMutation.isPending &&
                      deactivateUserMutation.variables?.userId === managedUser.id;
                    const isCurrentSession = managedUser.id === currentUser.id;
                    const selectableRoles = roleOptions.some((roleOption) => roleOption === managedUser.role)
                      ? [...roleOptions]
                      : [managedUser.role, ...roleOptions];

                    return (
                      <tr key={managedUser.id}>
                        <td data-label="Name">
                          <div className="stack stack-tight">
                            <strong>{managedUser.fullName}</strong>
                            {isCurrentSession ? (
                              <span className="helper-text">Current session</span>
                            ) : null}
                          </div>
                        </td>
                        <td data-label="Email">{managedUser.email}</td>
                        <td data-label="Role">
                          <StatusPill tone={getRoleTone(managedUser.role)}>{managedUser.role}</StatusPill>
                        </td>
                        <td data-label="Status">
                          <StatusPill tone={getStatusTone(managedUser.isActive)}>
                            {managedUser.isActive ? "Active" : "Inactive"}
                          </StatusPill>
                        </td>
                        <td data-label="Actions">
                          <div className="table-actions">
                            <select
                              aria-label={`Change role for ${managedUser.fullName}`}
                              className="select select-inline"
                              value={draftRole}
                              onChange={(event) => handleRoleDraftChange(managedUser.id, event.target.value as Role)}
                              disabled={isSavingRole || isDeactivating}
                            >
                              {selectableRoles.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                  {roleOption}
                                </option>
                              ))}
                            </select>

                            <button
                              aria-label={`Save role for ${managedUser.fullName}`}
                              className="button button-secondary"
                              type="button"
                              onClick={() => handleRoleSave(managedUser)}
                              disabled={!isRoleDirty || isSavingRole || isDeactivating}
                            >
                              {isSavingRole ? "Saving..." : "Save role"}
                            </button>

                            <button
                              aria-label={
                                isCurrentSession
                                  ? `${managedUser.fullName} is the current session`
                                  : `Deactivate ${managedUser.fullName}`
                              }
                              className="button button-danger"
                              type="button"
                              onClick={() => handleDeactivateUser(managedUser)}
                              disabled={isCurrentSession || !managedUser.isActive || isSavingRole || isDeactivating}
                            >
                              {isDeactivating ? "Deactivating..." : isCurrentSession ? "Current session" : "Deactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="stack">
          <SurfaceCard>
            <div className="stack">
              <p className="eyebrow">Create User</p>
              <h3>{selectedTenant ? `Add a user to ${selectedTenant.name}` : "Choose a tenant scope first"}</h3>
              <p className="helper-text">
                The form submits directly to the IAM user-management API for the currently selected
                tenant.
              </p>

              <form className="form-grid" onSubmit={handleSubmit(handleCreateUser)} noValidate>
                <div className="field">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    aria-describedby={errors.fullName ? "create-fullName-error" : undefined}
                    aria-invalid={Boolean(errors.fullName)}
                    className="input"
                    id="fullName"
                    placeholder="Jordan Smith"
                    {...register("fullName")}
                  />
                  {errors.fullName ? (
                    <span className="field-error" id="create-fullName-error">
                      {errors.fullName.message}
                    </span>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    aria-describedby={errors.email ? "create-email-error" : undefined}
                    aria-invalid={Boolean(errors.email)}
                    className="input"
                    id="email"
                    type="email"
                    placeholder="jordan@tenant.io"
                    {...register("email")}
                  />
                  {errors.email ? (
                    <span className="field-error" id="create-email-error">
                      {errors.email.message}
                    </span>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="password">Temporary Password</label>
                  <input
                    aria-describedby={errors.password ? "create-password-error" : "create-password-hint"}
                    aria-invalid={Boolean(errors.password)}
                    className="input"
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    {...register("password")}
                  />
                  {errors.password ? (
                    <span className="field-error" id="create-password-error">
                      {errors.password.message}
                    </span>
                  ) : (
                    <span className="helper-text" id="create-password-hint">
                      Use at least 8 characters so the new user can authenticate successfully.
                    </span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="role">Role</label>
                  <select
                    aria-describedby={errors.role ? "create-role-error" : undefined}
                    aria-invalid={Boolean(errors.role)}
                    className="select"
                    id="role"
                    {...register("role")}
                  >
                    {roleOptions.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption}
                      </option>
                    ))}
                  </select>
                  {errors.role ? (
                    <span className="field-error" id="create-role-error">
                      {errors.role.message}
                    </span>
                  ) : null}
                </div>

                <label className="checkbox-row" htmlFor="isActive">
                  <input id="isActive" type="checkbox" {...register("isActive")} />
                  <span>
                    <strong>Create as active</strong>
                    <span className="helper-text">Inactive accounts stay visible but cannot sign in.</span>
                  </span>
                </label>

                <button
                  aria-busy={createUserMutation.isPending}
                  className="button button-primary"
                  type="submit"
                  disabled={!selectedTenantId || createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Creating user..." : "Create user"}
                </button>
              </form>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="stack">
              <p className="eyebrow">Supported Actions</p>
              <h3>Current Phase 4 coverage</h3>
              <ul className="feature-list">
                <li>
                  <span className="metric-label">Create users</span>
                  <strong>Implemented</strong>
                </li>
                <li>
                  <span className="metric-label">Role assignment</span>
                  <strong>Implemented</strong>
                </li>
                <li>
                  <span className="metric-label">Deactivate accounts</span>
                  <strong>Implemented</strong>
                </li>
              </ul>
              <p className="helper-text">
                The current backend exposes create, role update, and deactivate flows. Editable
                profile fields can be added once the IAM API supports them.
              </p>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </>
  );
}
