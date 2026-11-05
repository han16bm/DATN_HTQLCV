import type { z } from "zod";
import type {
  notificationListSchema,
  notificationReadSchema,
  notificationQuerySchema,
  notificationSchema,
  notificationSummarySchema,
  notificationTypeSchema,
} from "../schemas/notifications.schema";

export type NotificationDto = z.output<typeof notificationSchema>;
export type NotificationReadResult = z.output<typeof notificationReadSchema>;
export type NotificationType = z.output<typeof notificationTypeSchema>;
export type NotificationQuery = z.input<typeof notificationQuerySchema>;
export type NotificationList = z.output<typeof notificationListSchema>;
export type NotificationSummary = z.output<typeof notificationSummarySchema>;
