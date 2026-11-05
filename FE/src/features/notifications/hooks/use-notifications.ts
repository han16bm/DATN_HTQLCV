"use client";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import {
  useAccessErrorHandler,
  useQueryAccess,
} from "@/lib/query/use-query-access";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsKeys } from "../api/notifications.keys";
import { notificationsService } from "../api/notifications.service";
import type {
  NotificationList,
  NotificationQuery,
} from "../types/notifications.types";

export function useNotificationSummary() {
  const id = useSession().session?.user.id;
  const query = useQuery({
    queryKey: notificationsKeys.summary(id),
    queryFn: ({ signal }) => notificationsService.summary({ signal }),
    enabled: Boolean(id),
    refetchInterval: 30000,
  });
  return useQueryAccess(query, "notifications");
}
export function useNotifications(query: NotificationQuery, open: boolean) {
  const id = useSession().session?.user.id;
  const result = useQuery({
    queryKey: notificationsKeys.list(id, query),
    queryFn: ({ signal }) => notificationsService.list(query, { signal }),
    enabled: Boolean(id && open),
  });
  return useQueryAccess(result, "notifications");
}
export function useReadNotification() {
  const id = useSession().session?.user.id;
  const client = useQueryClient();
  const run = useIdempotentRequest();
  const onError = useAccessErrorHandler();
  return useMutation({
    mutationKey: [...notificationsKeys.viewer(id), "read"],
    mutationFn: (notificationId: string) =>
      run({ notificationId }, (key) =>
        notificationsService.markRead(notificationId, { key }),
      ),
    onError,
    onSuccess: (result) => {
      client.setQueriesData<NotificationList>(
        { queryKey: [...notificationsKeys.viewer(id), "list"] },
        (list) =>
          list && {
            ...list,
            items: list.items.map((notice) =>
              notice.id === result.id
                ? { ...notice, readAt: result.readAt }
                : notice,
            ),
          },
      );
      return client.invalidateQueries({
        queryKey: notificationsKeys.summary(id),
      });
    },
  });
}
