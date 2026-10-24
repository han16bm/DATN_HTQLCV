"use client";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { Session } from "@/lib/auth/session-context";
import { refreshAuth, registerRefresh, token } from "@/services/api-client";
import { useUI } from "@/stores/ui-store";
import { ApiError } from "@/types/api/error";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { authKeys } from "../api/auth.keys";
import { authService } from "../api/auth.service";

export function AuthObserver({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const signIn = useCallback(
    async (session: SessionDto) => {
      await client.cancelQueries();
      client.clear();
      useUI.getState().reset();
      client.setQueryData(authKeys.getSession(session.user.id), session);
      setViewerId(session.user.id);
    },
    [client],
  );
  const clear = useCallback(async () => {
    await client.cancelQueries();
    client.clear();
    token.set(null);
    useUI.getState().reset();
    setViewerId(null);
  }, [client]);
  useEffect(() => {
    registerRefresh(async () => {
      try {
        const session = await authService.refreshSession();
        client.setQueryData(authKeys.getSession(session.user.id), session);
        setViewerId(session.user.id);
      } catch (error) {
        await clear();
        throw error;
      }
    });
    void refreshAuth()
      .catch(() => {})
      .finally(() => setRestoring(false));
    return () => registerRefresh(null);
  }, [client, clear]);
  const query = useQuery({
    queryKey: authKeys.getSession(viewerId ?? "anonymous"),
    queryFn: ({ signal }) =>
      authService.getSession({
        signal,
      }),
    enabled: Boolean(viewerId),
    staleTime: 0,
    retry: false,
  });
  useEffect(() => {
    if (
      query.error instanceof ApiError &&
      [401, 403].includes(query.error.status)
    )
      void clear();
  }, [query.error, clear]);
  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      toast.error(
        "Đã dọn phiên trên máy. Máy chủ chưa xác nhận thu hồi phiên.",
      );
    } finally {
      await clear();
    }
  }, [clear]);
  return (
    <Session
      value={{
        session: query.data ?? null,
        loading: restoring || Boolean(viewerId && query.isPending),
        refresh: query.refetch,
        signIn,
        signOut,
      }}
    >
      {children}
    </Session>
  );
}
