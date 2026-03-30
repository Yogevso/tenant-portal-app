import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { AppShell } from "../layouts/AppShell";
import { ADMIN_ROLES } from "../../features/auth/access";
import { GuestOnlyRoute, RequireAuth, RequireRoles } from "../../features/auth/components/RouteGuards";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { AuditLogsPage } from "../../features/audit-logs/pages/AuditLogsPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { NotFoundPage } from "../../features/system/pages/NotFoundPage";
import { UnauthorizedPage } from "../../features/system/pages/UnauthorizedPage";
import { UsersPage } from "../../features/users/pages/UsersPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate replace to="/dashboard" />,
  },
  {
    path: "/login",
    element: (
      <GuestOnlyRoute>
        <LoginPage />
      </GuestOnlyRoute>
    ),
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            element: <RequireRoles allowedRoles={ADMIN_ROLES} />,
            children: [
              {
                path: "/users",
                element: <UsersPage />,
              },
              {
                path: "/audit-logs",
                element: <AuditLogsPage />,
              },
            ],
          },
          {
            path: "/unauthorized",
            element: <UnauthorizedPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
