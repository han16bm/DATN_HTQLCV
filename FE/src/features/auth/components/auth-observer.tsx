"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Session } from "@/lib/auth/session-context";
import {
  token,
  registerRefresh,
  refreshSingleFlight,
} from "@/services/auth-session";
import { useUI } from "@/stores/ui-store";
import { toast } from "sonner";
import type { AuthSessionDTO } from "../types/auth.types";
import { authService } from "../api/auth.service";
import { authKeys } from "../api/auth.keys";

export function AuthObserver({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const signIn = useCallback(
    async (session: AuthSessionDTO) => {
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
        const session = await authService.refreshSession({});
        client.setQueryData(authKeys.getSession(session.user.id), session);
        setViewerId(session.user.id);
      } catch (error) {
        await clear();
        throw error;
      }
    });
    void refreshSingleFlight()
      .catch(() => {})
      .finally(() => setRestoring(false));
    return () => registerRefresh(null);
  }, [client, clear]);
  const query = useQuery({
    queryKey: authKeys.getSession(viewerId ?? "anonymous"),
    queryFn: ({ signal }) => authService.getSession({ signal }),
    enabled: Boolean(viewerId),
    staleTime: 0,
    retry: false,
  });
  const signOut = useCallback(async () => {
    try {
      await authService.logout({});
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
