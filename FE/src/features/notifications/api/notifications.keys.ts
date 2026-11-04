import type { ViewerId } from "@/types/common";
import type { NotificationQuery } from "../types/notifications.types";

export const notificationsKeys = {
  viewer: (id: ViewerId) => ["notifications", id] as const,
  list: (id: ViewerId, query: NotificationQuery) =>
    [...notificationsKeys.viewer(id), "list", query] as const,
  summary: (id: ViewerId) =>
    [...notificationsKeys.viewer(id), "summary"] as const,
};
