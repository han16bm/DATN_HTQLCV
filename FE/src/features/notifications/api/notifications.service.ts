import {
  apiClient,
  type MutationOptions,
  type RequestOptions,
} from "@/services/api-client";
import {
  notificationListSchema,
  notificationReadSchema,
  notificationSummarySchema,
} from "../schemas/notifications.schema";
import type {
  NotificationReadResult,
  NotificationList,
  NotificationQuery,
  NotificationSummary,
} from "../types/notifications.types";

export const notificationsService = {
  async list(query: NotificationQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<NotificationList>("/notifications", {
      ...options,
      params: query,
      schema: notificationListSchema,
    });
    return response.data;
  },
  async summary(options: RequestOptions = {}) {
    const response = await apiClient.get<NotificationSummary>(
      "/notifications/summary",
      { ...options, schema: notificationSummarySchema },
    );
    return response.data;
  },
  async markRead(notificationId: string, options: MutationOptions) {
    const response = await apiClient.patch<NotificationReadResult>(
      `/notifications/${encodeURIComponent(notificationId)}`,
      { read: true },
      { ...options, schema: notificationReadSchema },
    );
    return response.data;
  },
};
