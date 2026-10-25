import {
  alertQuerySchema,
  alertRowSchema,
  alertSchema,
  updateAlertSchema,
} from "@/features/alerts/schemas/alerts.schema";
import { page } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { alertsDb } from "../db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";
export const alertHandlers = [
  http.get(
    "*/api/alerts",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, alertQuerySchema);
      return mockJson(
        request,
        alertsDb.listAlerts(viewer, query),
        page(alertRowSchema),
        200,
      );
    }),
  ),
  http.get(
    "*/api/alerts/:alertId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const alertId = idSchema.parse(params.alertId);
      return mockJson(
        request,
        alertsDb.getAlert(viewer, alertId),
        alertSchema,
        200,
      );
    }),
  ),
  http.patch(
    "*/api/alerts/:alertId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const alertId = idSchema.parse(params.alertId);
      const payload = updateAlertSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateAlert",
          feature: "alerts",
          viewer,
          permission: "ALERTS_MANAGE",
          params: { alertId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            alertsDb.updateAlert(
              viewer,
              alertId,
              payload,
              request.headers.get("If-Match"),
            ),
            alertSchema,
            200,
          );
        },
      );
    }),
  ),
];
