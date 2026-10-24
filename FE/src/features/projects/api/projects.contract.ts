// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  ProjectsProjectStatusSchema,
  ProjectsProjectSchema,
} from "../schemas/projects.schema";
import { TasksAuditSchema } from "@/types/common";
import { page } from "@/types/common";
export const listProjectsContract = endpoint({
  ...{
    name: "listProjects",
    feature: "projects",
    method: "GET",
    path: "/api/v1/projects",
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
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      status: ProjectsProjectStatusSchema.optional(),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(ProjectsProjectSchema),
});

export const getProjectContract = endpoint({
  ...{
    name: "getProject",
    feature: "projects",
    method: "GET",
    path: "/api/v1/projects/:projectId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
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
  body: z.object({}).strict(),
  response: ProjectsProjectSchema,
});

export const createProjectContract = endpoint({
  ...{
    name: "createProject",
    feature: "projects",
    method: "POST",
    path: "/api/v1/projects",
    version: false,
    idempotency: true,
    invalidates: ["projects", "project-members", "auth"],
    permission: "PROJECT_CREATE",
    fields: [
      {
        name: "code",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 2; độ dài ≤ 32; mẫu: ^[A-Z0-9_-]+$; Mã dự án duy nhất; không sửa bằng ProjectPatch.",
      },
      {
        name: "name",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim.",
      },
      {
        name: "objective",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 2000; Mục tiêu dự án.",
      },
      {
        name: "unitId",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép.",
      },
      {
        name: "ownerId",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án.",
      },
      {
        name: "startDate",
        type: "string · YYYY-MM-DD",
        required: true,
        rules: "Ngày bắt đầu kế hoạch theo ngày Việt Nam.",
      },
      {
        name: "dueAt",
        type: "string · UTC ISO 8601 có Z",
        required: true,
        rules: "Hạn hiện tại đủ ngày/giờ, ISO UTC có Z.",
      },
    ],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      code: z
        .string()
        .trim()
        .min(2, "Vui lòng nhập thông tin bắt buộc")
        .max(32)
        .regex(/^[A-Z0-9_-]+$/),
      name: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255),
      objective: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      ownerId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      startDate: z.iso.date(),
      dueAt: z.iso.datetime(),
    })
    .strict(),
  response: ProjectsProjectSchema,
});

export const updateProjectContract = endpoint({
  ...{
    name: "updateProject",
    feature: "projects",
    method: "PATCH",
    path: "/api/v1/projects/:projectId",
    version: true,
    idempotency: true,
    invalidates: ["projects", "project-members", "auth", "analytics"],
    permission: "PROJECT_MANAGE",
    fields: [
      {
        name: "name",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim.",
      },
      {
        name: "objective",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 2000; Mục tiêu dự án.",
      },
      {
        name: "ownerId",
        type: "string",
        required: false,
        rules:
          "độ dài ≥ 1; độ dài ≤ 100; Người phụ trách hoạt động; đổi owner đồng bộ tư cách và quyền trên dự án.",
      },
      {
        name: "startDate",
        type: "string · YYYY-MM-DD",
        required: false,
        rules: "Ngày bắt đầu kế hoạch theo ngày Việt Nam.",
      },
      {
        name: "dueAt",
        type: "string · UTC ISO 8601 có Z",
        required: false,
        rules: "Hạn hiện tại đủ ngày/giờ, ISO UTC có Z.",
      },
      {
        name: "changeReason",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do đổi kế hoạch; bắt buộc theo điều kiện API và dữ liệu hiện tại.",
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
      name: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255)
        .optional(),
      objective: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000)
        .optional(),
      ownerId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      startDate: z.iso.date().optional(),
      dueAt: z.iso.datetime().optional(),
      changeReason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: ProjectsProjectSchema,
});

export const activateProjectContract = endpoint({
  ...{
    name: "activateProject",
    feature: "projects",
    method: "POST",
    path: "/api/v1/projects/:projectId/activate",
    version: true,
    idempotency: true,
    invalidates: ["projects"],
    permission: "PROJECT_MANAGE",
    fields: [],
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
  body: z.object({}).strict(),
  response: ProjectsProjectSchema,
});

export const getProjectClosureChecksContract = endpoint({
  ...{
    name: "getProjectClosureChecks",
    feature: "projects",
    method: "GET",
    path: "/api/v1/projects/:projectId/closure-checks",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "PROJECT_MANAGE",
    fields: [],
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
  body: z.object({}).strict(),
  response: z.object({
    openTaskCount: z.number().int().safe().min(0),
    pendingReviewCount: z.number().int().safe().min(0),
    pendingReportCount: z.number().int().safe().min(0),
    canClose: z.boolean(),
  }),
});

export const completeProjectContract = endpoint({
  ...{
    name: "completeProject",
    feature: "projects",
    method: "POST",
    path: "/api/v1/projects/:projectId/complete",
    version: true,
    idempotency: true,
    invalidates: ["projects", "tasks", "reports", "analytics"],
    permission: "PROJECT_MANAGE",
    fields: [],
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
  body: z.object({}).strict(),
  response: ProjectsProjectSchema,
});

export const cancelProjectContract = endpoint({
  ...{
    name: "cancelProject",
    feature: "projects",
    method: "POST",
    path: "/api/v1/projects/:projectId/cancel",
    version: true,
    idempotency: true,
    invalidates: ["projects", "tasks", "reports", "analytics"],
    permission: "PROJECT_MANAGE",
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
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: ProjectsProjectSchema,
});

export const listProjectHistoryContract = endpoint({
  ...{
    name: "listProjectHistory",
    feature: "projects",
    method: "GET",
    path: "/api/v1/projects/:projectId/history",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
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
