import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ApiError, apiRequest, type ApiRequestOptions } from "../../../lib/api/client";
import type { AuthSession, Role } from "../../../types/auth";
import { loginRequest, logoutRequest, refreshRequest, type LoginPayload } from "../api/authApi";
import { clearStoredRefreshToken, readStoredRefreshToken, writeStoredRefreshToken } from "../authStorage";
import { AuthContext, type AuthContextValue, type AuthFailureReason, type AuthStatus } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

interface SessionSnapshot {
  accessToken: string;
  user: AuthSession["user"];
  tenant: AuthSession["tenant"];
}
function getFailureReason(error: unknown): Exclude<AuthFailureReason, null> {
  if (error instanceof ApiError && error.status === 401) {
    return "session_expired";
  }

  return "service_unavailable";
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [authFailureReason, setAuthFailureReason] = useState<AuthFailureReason>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthSession> | null>(null);

  const applySession = useCallback((nextSession: AuthSession) => {
    writeStoredRefreshToken(nextSession.refreshToken);
    accessTokenRef.current = nextSession.accessToken;
    setSession({
      accessToken: nextSession.accessToken,
      user: nextSession.user,
      tenant: nextSession.tenant,
    });
    setStatus("authenticated");
    setAuthFailureReason(null);
  }, []);

  const clearSession = useCallback(
    (reason: AuthFailureReason, options?: { clearPersistedRefreshToken?: boolean }) => {
      if (options?.clearPersistedRefreshToken ?? true) {
        clearStoredRefreshToken();
      }

      accessTokenRef.current = null;
      refreshPromiseRef.current = null;
      setSession(null);
      setStatus("unauthenticated");
      setAuthFailureReason(reason);
      queryClient.clear();
    },
    [queryClient],
  );

  const refreshSession = useCallback(async () => {
    const persistedRefreshToken = readStoredRefreshToken();

    if (!persistedRefreshToken) {
      clearSession(null);
      throw new Error("No persisted refresh token is available.");
    }

    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshRequest(persistedRefreshToken)
        .then((nextSession) => {
          applySession(nextSession);
          return nextSession;
        })
        .catch((error: unknown) => {
          const failureReason = getFailureReason(error);

          clearSession(failureReason, {
            clearPersistedRefreshToken: failureReason === "session_expired",
          });

          throw error;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, [applySession, clearSession]);

  useEffect(() => {
    const persistedRefreshToken = readStoredRefreshToken();

    if (!persistedRefreshToken) {
      setStatus("unauthenticated");
      return;
    }

    void refreshSession().catch(() => undefined);
  }, [refreshSession]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const nextSession = await loginRequest(payload);
      queryClient.clear();
      applySession(nextSession);
    },
    [applySession, queryClient],
  );

  const logout = useCallback(async () => {
    const persistedRefreshToken = readStoredRefreshToken();

    try {
      if (persistedRefreshToken) {
        await logoutRequest(persistedRefreshToken);
      }
    } catch {
      // Local sign-out should still complete even if the revoke request fails.
    } finally {
      clearSession(null);
    }
  }, [clearSession]);

  const authenticatedRequest = useCallback(
    async <T,>(path: string, options: Omit<ApiRequestOptions, "accessToken"> = {}) => {
      const execute = async (token: string) => apiRequest<T>(path, { ...options, accessToken: token });

      let accessToken = accessTokenRef.current;

      if (!accessToken) {
        const nextSession = await refreshSession();
        accessToken = nextSession.accessToken;
      }

      try {
        return await execute(accessToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        const nextSession = await refreshSession();
        return execute(nextSession.accessToken);
      }
    },
    [refreshSession],
  );

  const hasAnyRole = useCallback(
    (...roles: Role[]) => {
      if (!session) {
        return false;
      }

      return roles.includes(session.user.role);
    },
    [session],
  );

  const clearAuthFailureReason = useCallback(() => {
    setAuthFailureReason(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      tenant: session?.tenant ?? null,
      accessToken: session?.accessToken ?? null,
      authFailureReason,
      isAuthenticated: status === "authenticated",
      login,
      logout,
      authenticatedRequest,
      hasAnyRole,
      clearAuthFailureReason,
    }),
    [
      status,
      session,
      authFailureReason,
      login,
      logout,
      authenticatedRequest,
      hasAnyRole,
      clearAuthFailureReason,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
