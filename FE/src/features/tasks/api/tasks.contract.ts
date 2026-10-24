// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  TasksTaskStatusSchema,
  TasksPrioritySchema,
  TasksTaskSchema,
} from "../schemas/tasks.schema";
import { TasksAuditSchema } from "@/types/common";
import { page } from "@/types/common";
export const listTasksContract = endpoint({
  ...{
    name: "listTasks",
    feature: "tasks",
    method: "GET",
    path: "/api/v1/tasks",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
    .object({
      page: z.number().int().safe().min(1).optional().default(1),
      pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
      q: z.string().trim().max(255).optional(),
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      assigneeId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      status: TasksTaskStatusSchema.optional(),
      priority: TasksPrioritySchema.optional(),
      overdue: z.boolean().optional(),
      dueFrom: z.iso.datetime().optional(),
      dueTo: z.iso.datetime().optional(),
      sort: z
        .enum(["dueAt", "-dueAt", "updatedAt", "-updatedAt"])
        .optional()
        .default("dueAt"),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(TasksTaskSchema),
});

export const getTaskContract = endpoint({
  ...{
    name: "getTask",
    feature: "tasks",
    method: "GET",
    path: "/api/v1/tasks/:taskId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      taskId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: TasksTaskSchema,
});

export const createTaskContract = endpoint({
  ...{
    name: "createTask",
    feature: "tasks",
    method: "POST",
    path: "/api/v1/projects/:projectId/tasks",
    version: false,
    idempotency: true,
    invalidates: ["tasks", "projects", "analytics"],
    permission: "TASKS_MANAGE",
    fields: [
      {
        name: "title",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Tên công việc 1–255 ký tự sau trim.",
      },
      {
        name: "description",
        type: "string / null",
        required: false,
        rules: "Mô tả; task nhận null để bỏ mô tả.",
      },
      {
        name: "acceptanceCriteria",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Tiêu chí dùng đối chiếu khi nghiệm thu.",
      },
      {
        name: "priority",
        type: "Tasks.PriorityDTO",
        required: true,
        rules: "LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt.",
      },
      {
        name: "dueAt",
        type: "string · UTC ISO 8601 có Z",
        required: true,
        rules: "Hạn hiện tại đủ ngày/giờ, ISO UTC có Z.",
      },
      {
        name: "estimatedMinutes",
        type: "integer",
        required: true,
        rules: "> 0; ≤ 5256000; Phút dự kiến hiện tại, số nguyên dương.",
      },
    ],
  },
  params: z
    .object({
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255),
      description: z.string().trim().nullable().optional(),
      acceptanceCriteria: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
      priority: TasksPrioritySchema,
      dueAt: z.iso.datetime(),
      estimatedMinutes: z.number().int().safe().max(5256000).positive(),
    })
    .strict(),
  response: TasksTaskSchema,
});

export const updateTaskContract = endpoint({
  ...{
    name: "updateTask",
    feature: "tasks",
    method: "PATCH",
    path: "/api/v1/tasks/:taskId",
    version: true,
    idempotency: true,
    invalidates: ["tasks", "projects", "analytics", "alerts"],
    permission: "TASKS_MANAGE",
    fields: [
      {
        name: "title",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Tên công việc 1–255 ký tự sau trim.",
      },
      {
        name: "description",
        type: "string / null",
        required: false,
        rules: "Mô tả; task nhận null để bỏ mô tả.",
      },
      {
        name: "acceptanceCriteria",
        type: "string",
        required: false,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Tiêu chí dùng đối chiếu khi nghiệm thu.",
      },
      {
        name: "priority",
        type: "Tasks.PriorityDTO",
        required: false,
        rules: "LOW/NORMAL/HIGH/URGENT; UI ánh xạ nhãn Việt.",
      },
      {
        name: "dueAt",
        type: "string · UTC ISO 8601 có Z",
        required: false,
        rules: "Hạn hiện tại đủ ngày/giờ, ISO UTC có Z.",
      },
      {
        name: "estimatedMinutes",
        type: "integer",
        required: false,
        rules: "> 0; ≤ 5256000; Phút dự kiến hiện tại, số nguyên dương.",
      },
      {
        name: "changeReason",
        type: "string",
        required: false,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do đổi kế hoạch; bắt buộc theo điều kiện API và dữ liệu hiện tại.",
      },
    ],
  },
  params: z
    .object({
      taskId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255)
        .optional(),
      description: z.string().trim().nullable().optional(),
      acceptanceCriteria: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000)
        .optional(),
      priority: TasksPrioritySchema.optional(),
      dueAt: z.iso.datetime().optional(),
      estimatedMinutes: z
        .number()
        .int()
        .safe()
        .max(5256000)
        .positive()
        .optional(),
      changeReason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000)
        .optional(),
    })
    .strict(),
  response: TasksTaskSchema,
});

export const assignTaskContract = endpoint({
  ...{
    name: "assignTask",
    feature: "tasks",
    method: "POST",
    path: "/api/v1/tasks/:taskId/assignments",
    version: true,
    idempotency: true,
    invalidates: ["tasks", "project-members", "analytics", "alerts"],
    permission: "TASKS_MANAGE",
    fields: [
      {
        name: "assigneeId",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 100; Người chịu trách nhiệm hiện tại với việc mở; với việc kết thúc, giữ người phụ trách cuối theo D15.",
      },
      {
        name: "reason",
        type: "string",
        required: false,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity.",
      },
    ],
  },
  params: z
    .object({
      taskId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      assigneeId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000)
        .optional(),
    })
    .strict(),
  response: TasksTaskSchema,
});

export const startTaskContract = endpoint({
  ...{
    name: "startTask",
    feature: "tasks",
    method: "POST",
    path: "/api/v1/tasks/:taskId/start",
    version: true,
    idempotency: true,
    invalidates: ["tasks", "analytics"],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      taskId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: TasksTaskSchema,
});

export const pauseTaskContract = endpoint({
  ...{
    name: "pauseTask",
    feature: "tasks",
    method: "POST",
    path: "/api/v1/tasks/:taskId/pause",
    version: true,
    idempotency: true,
    invalidates: ["tasks", "analytics"],
    permission: null,
    fields: [
      {
        name: "reason",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity.",
      },
    ],
  },
  params: z
    .object({
      taskId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: TasksTaskSchema,
});

export const cancelTaskContract = endpoint({
  ...{
    name: "cancelTask",
    feature: "tasks",
    method: "POST",
    path: "/api/v1/tasks/:taskId/cancel",
    version: true,
    idempotency: true,
    invalidates: ["tasks", "projects", "analytics", "alerts"],
    permission: "TASKS_MANAGE",
    fields: [
      {
        name: "reason",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity.",
      },
    ],
  },
  params: z
    .object({
      taskId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: TasksTaskSchema,
});

export const updateRemainingEstimateContract = endpoint({
  ...{
    name: "updateRemainingEstimate",
    feature: "tasks",
    method: "PATCH",
    path: "/api/v1/tasks/:taskId/remaining-estimate",
    version: true,
    idempotency: true,
    invalidates: ["tasks", "analytics", "alerts"],
    permission: null,
    fields: [
      {
        name: "remainingMinutes",
        type: "integer",
        required: true,
        rules:
          "≥ 0; ≤ 5256000; Phút còn lại được nhập riêng; null là chưa cập nhật, không tự suy bằng phép trừ.",
      },
    ],
  },
  params: z
    .object({
      taskId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      remainingMinutes: z.number().int().safe().min(0).max(5256000),
    })
    .strict(),
  response: TasksTaskSchema,
});

export const listTaskHistoryContract = endpoint({
  ...{
    name: "listTaskHistory",
    feature: "tasks",
    method: "GET",
    path: "/api/v1/tasks/:taskId/history",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      taskId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z
    .object({
      page: z.number().int().safe().min(1).optional().default(1),
      pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
      q: z.string().trim().max(255).optional(),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(TasksAuditSchema),
});
