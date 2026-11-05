import {
  notificationListSchema,
  notificationQuerySchema,
  notificationReadSchema,
  notificationSummarySchema,
  readNotificationSchema,
} from "@/features/notifications/schemas/notifications.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { notificationsDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";

export const notificationHandlers = [
  http.get(
    "*/api/notifications/summary",
    mockHandler(async ({ request }) => {
      parseQuery(request, emptySchema);
      return mockJson(
        request,
        notificationsDb.summary(authenticatedUser(request)),
        notificationSummarySchema,
        200,
      );
    }),
  ),
  http.get(
    "*/api/notifications",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      return mockJson(
        request,
        notificationsDb.list(
          viewer,
          parseQuery(request, notificationQuerySchema),
        ),
        notificationListSchema,
        200,
      );
    }),
  ),
  http.patch(
    "*/api/notifications/:notificationId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const notificationId = idSchema.parse(params.notificationId);
      const payload = readNotificationSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "readNotification",
          feature: "notifications",
          viewer,
          action: null,
          params: { notificationId },
          payload,
        },
        () =>
          mockJson(
            request,
            notificationsDb.markRead(viewer, notificationId),
            notificationReadSchema,
            200,
          ),
      );
    }),
  ),
];
