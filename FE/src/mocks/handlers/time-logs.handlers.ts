import {
  createTimeLogSchema,
  timeLogChangeResultSchema,
  timeLogQuerySchema,
  timeLogSchema,
  updateTimeLogSchema,
} from "@/features/time-logs/schemas/time-logs.schema";
import { page, reasonSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { timeLogsDb } from "../db/time-logs.db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "../utils/handler";
export const timeLogHandlers = [
  http.get(
    "*/api/v1/tasks/:taskId/time-logs",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const query = parseQuery(request, timeLogQuerySchema);
      return mockJson(
        request,
        timeLogsDb.listTimeLogs(viewer, taskId, query),
        page(timeLogSchema),
        200,
      );
    }),
  ),
  http.post(
    "*/api/v1/tasks/:taskId/time-logs",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const payload = createTimeLogSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createTimeLog",
          feature: "time-logs",
          viewer,
          permission: null,
          params: { taskId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            timeLogsDb.createTimeLog(
              viewer,
              taskId,
              payload,
              request.headers.get("If-Match"),
            ),
            timeLogChangeResultSchema,
            201,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/v1/time-logs/:timeLogId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const timeLogId = idSchema.parse(params.timeLogId);
      const payload = updateTimeLogSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateTimeLog",
          feature: "time-logs",
          viewer,
          permission: null,
          params: { timeLogId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            timeLogsDb.updateTimeLog(
              viewer,
              timeLogId,
              payload,
              request.headers.get("If-Match"),
            ),
            timeLogChangeResultSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/v1/time-logs/:timeLogId/void",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const timeLogId = idSchema.parse(params.timeLogId);
      const payload = reasonSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "voidTimeLog",
          feature: "time-logs",
          viewer,
          permission: null,
          params: { timeLogId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            timeLogsDb.voidTimeLog(
              viewer,
              timeLogId,
              payload,
              request.headers.get("If-Match"),
            ),
            timeLogChangeResultSchema,
            200,
          );
        },
      );
    }),
  ),
];
