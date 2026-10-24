"use client";
import { useSession } from "@/lib/auth/session-context";
import { ApiError } from "@/types/api/error";
import { useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { removeViewerData } from "./remove-viewer-data";

export function useAccessErrorHandler() {
  const client = useQueryClient();
  const { session, refresh } = useSession();
  const viewerId = session?.user.id;
  return useCallback(
    async (error: Error) => {
      if (viewerId && error instanceof ApiError && error.status === 403) {
        await removeViewerData(client, viewerId);
        await refresh().catch(() => {});
      }
    },
    [client, viewerId, refresh],
  );
}
export function useQueryAccess<T>(
  query: UseQueryResult<T, Error>,
  feature: string,
) {
  const client = useQueryClient();
  const { session } = useSession();
  const handleError = useAccessErrorHandler();
  const viewerId = session?.user.id;
  const error = query.error;
  const denied = error instanceof ApiError && [403, 410].includes(error.status);
  useEffect(() => {
    if (!denied) return;
    if (error.status === 403) void handleError(error);
    else {
      const filters = { queryKey: [feature, viewerId] };
      void client.cancelQueries(filters);
      client.removeQueries(filters);
    }
  }, [denied, error, client, feature, viewerId, handleError]);
  return { ...query, data: denied ? undefined : query.data };
}
export type QueryOptions = { enabled?: boolean };
