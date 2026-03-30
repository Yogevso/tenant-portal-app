import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { AppShell } from "../layouts/AppShell";
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
    element: <LoginPage />,
  },
  {
    element: <AppShell />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/users",
        element: <UsersPage />,
      },
      {
        path: "/audit-logs",
        element: <AuditLogsPage />,
      },
      {
        path: "/unauthorized",
        element: <UnauthorizedPage />,
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
