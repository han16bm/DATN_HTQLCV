import { page, paginationSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "TASK_ASSIGNED",
  "TASK_UPDATED",
  "RESULT_SUBMITTED",
  "RESULT_APPROVED",
  "CHANGES_REQUESTED",
  "ALERT_CREATED",
]);
export const notificationSchema = z
  .object({
    id: idSchema,
    type: notificationTypeSchema,
    title: z.string().min(1),
    href: z.string().regex(/^\/(?:tasks|alerts)\//),
    createdAt: z.iso.datetime(),
    readAt: z.iso.datetime().nullable(),
  })
  .strict();
export const notificationQuerySchema = paginationSchema
  .pick({ page: true, pageSize: true })
  .partial()
  .strict()
  .transform((query) => ({
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10,
  }));
export const notificationListSchema = page(notificationSchema);
export const notificationReadSchema = notificationSchema
  .pick({ id: true, readAt: true })
  .extend({ readAt: z.iso.datetime() });
export const notificationSummarySchema = z
  .object({ unreadCount: z.number().int().nonnegative() })
  .strict();
export const readNotificationSchema = z
  .object({ read: z.literal(true) })
  .strict();
