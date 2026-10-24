import {
  assignTaskSchema,
  createTaskSchema,
  remainingSchema,
  updateTaskSchema,
} from "@/features/tasks/schemas/task-form.schema";
import {
  taskHistoryQuerySchema,
  taskQuerySchema,
  taskSchema,
} from "@/features/tasks/schemas/task.schema";
import {
  auditSchema,
  page,
  reasonSchema,
} from "@/lib/validation/common.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { tasksDb } from "../db/tasks.db";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "../utils/handler";
export const taskHandlers = [
  http.get(
    "*/api/v1/tasks",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, taskQuerySchema);
      return mockJson(
        request,
        tasksDb.listTasks(viewer, query),
        page(taskSchema),
        200,
      );
    }),
  ),
  http.get(
    "*/api/v1/tasks/:taskId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      return mockJson(
        request,
        tasksDb.getTask(viewer, taskId),
        taskSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/v1/projects/:projectId/tasks",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const projectId = idSchema.parse(params.projectId);
      const payload = createTaskSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createTask",
          feature: "tasks",
          viewer,
          permission: "TASKS_MANAGE",
          params: { projectId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            tasksDb.createTask(viewer, projectId, payload),
            taskSchema,
            201,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/v1/tasks/:taskId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const payload = updateTaskSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateTask",
          feature: "tasks",
          viewer,
          permission: "TASKS_MANAGE",
          params: { taskId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            tasksDb.updateTask(
              viewer,
              taskId,
              payload,
              request.headers.get("If-Match"),
            ),
            taskSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/v1/tasks/:taskId/assignments",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const payload = assignTaskSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "assignTask",
          feature: "tasks",
          viewer,
          permission: "TASKS_MANAGE",
          params: { taskId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            tasksDb.assignTask(
              viewer,
              taskId,
              payload,
              request.headers.get("If-Match"),
            ),
            taskSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/v1/tasks/:taskId/start",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const payload = emptySchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "startTask",
          feature: "tasks",
          viewer,
          permission: null,
          params: { taskId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            tasksDb.startTask(viewer, taskId, request.headers.get("If-Match")),
            taskSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/v1/tasks/:taskId/pause",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const payload = reasonSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "pauseTask",
          feature: "tasks",
          viewer,
          permission: null,
          params: { taskId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            tasksDb.pauseTask(
              viewer,
              taskId,
              payload,
              request.headers.get("If-Match"),
            ),
            taskSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/v1/tasks/:taskId/cancel",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const payload = reasonSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "cancelTask",
          feature: "tasks",
          viewer,
          permission: "TASKS_MANAGE",
          params: { taskId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            tasksDb.cancelTask(
              viewer,
              taskId,
              payload,
              request.headers.get("If-Match"),
            ),
            taskSchema,
            200,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/v1/tasks/:taskId/remaining-estimate",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const payload = remainingSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateRemainingEstimate",
          feature: "tasks",
          viewer,
          permission: null,
          params: { taskId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            tasksDb.updateRemainingEstimate(
              viewer,
              taskId,
              payload,
              request.headers.get("If-Match"),
            ),
            taskSchema,
            200,
          );
        },
      );
    }),
  ),
  http.get(
    "*/api/v1/tasks/:taskId/history",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const taskId = idSchema.parse(params.taskId);
      const query = parseQuery(request, taskHistoryQuerySchema);
      return mockJson(
        request,
        tasksDb.listTaskHistory(viewer, taskId, query),
        page(auditSchema),
        200,
      );
    }),
  ),
];
