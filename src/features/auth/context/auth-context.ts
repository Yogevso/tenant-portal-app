import { createContext } from "react";

import type { ApiRequestOptions } from "../../../lib/api/client";
import type { AuthSession, Role } from "../../../types/auth";
import type { LoginPayload } from "../api/authApi";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
export type AuthFailureReason = "session_expired" | "service_unavailable" | null;

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthSession["user"] | null;
  tenant: AuthSession["tenant"] | null;
  accessToken: string | null;
  authFailureReason: AuthFailureReason;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  authenticatedRequest: <T>(path: string, options?: Omit<ApiRequestOptions, "accessToken">) => Promise<T>;
  hasAnyRole: (...roles: Role[]) => boolean;
  clearAuthFailureReason: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
