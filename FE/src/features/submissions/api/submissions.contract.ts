// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import { SubmissionsSubmissionSchema } from "../schemas/submissions.schema";
import { TasksTaskSchema } from "@/features/tasks";
import { page } from "@/types/common";
export const listSubmissionsContract = endpoint({
  ...{
    name: "listSubmissions",
    feature: "submissions",
    method: "GET",
    path: "/api/v1/tasks/:taskId/submissions",
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
  response: page(SubmissionsSubmissionSchema),
});

export const getSubmissionContract = endpoint({
  ...{
    name: "getSubmission",
    feature: "submissions",
    method: "GET",
    path: "/api/v1/tasks/:taskId/submissions/:submissionId",
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
      submissionId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: SubmissionsSubmissionSchema,
});

export const createSubmissionContract = endpoint({
  ...{
    name: "createSubmission",
    feature: "submissions",
    method: "POST",
    path: "/api/v1/tasks/:taskId/submissions",
    version: true,
    idempotency: true,
    invalidates: ["submissions", "tasks", "reviews", "analytics", "alerts"],
    permission: null,
    fields: [
      {
        name: "summary",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 2000; Tóm tắt kết quả bắt buộc.",
      },
      {
        name: "links",
        type: "array<string>",
        required: true,
        rules: "số phần tử ≤ 10; Mảng liên kết HTTP/HTTPS tùy chọn.",
      },
      {
        name: "attachmentIds",
        type: "array<string>",
        required: true,
        rules:
          "số phần tử ≤ 10; Tệp READY đúng quyền/công việc; tối đa theo contract và policy.",
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
      summary: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
      links: z.array(
        z
          .string()
          .trim()
          .url()
          .refine(
            (v) => /^https?:\/\//.test(v),
            "Chỉ nhận liên kết HTTP/HTTPS",
          ),
      ),
      attachmentIds: z.array(z.string().trim()),
    })
    .strict(),
  response: z.object({
    submission: SubmissionsSubmissionSchema,
    task: TasksTaskSchema,
  }),
});

export const approveSubmissionContract = endpoint({
  ...{
    name: "approveSubmission",
    feature: "submissions",
    method: "POST",
    path: "/api/v1/tasks/:taskId/submissions/:submissionId/approve",
    version: true,
    idempotency: true,
    invalidates: [
      "submissions",
      "tasks",
      "reviews",
      "projects",
      "analytics",
      "alerts",
    ],
    permission: "TASKS_REVIEW",
    fields: [
      {
        name: "comment",
        type: "string",
        required: false,
        rules: "độ dài ≤ 10000; Nhận xét tùy chọn khi chấp nhận.",
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
      submissionId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      comment: z.string().trim().max(10000).optional(),
    })
    .strict(),
  response: z.object({
    submission: SubmissionsSubmissionSchema,
    task: TasksTaskSchema,
  }),
});

export const requestSubmissionRevisionContract = endpoint({
  ...{
    name: "requestSubmissionRevision",
    feature: "submissions",
    method: "POST",
    path: "/api/v1/tasks/:taskId/submissions/:submissionId/request-revision",
    version: true,
    idempotency: true,
    invalidates: ["submissions", "tasks", "reviews", "analytics", "alerts"],
    permission: "TASKS_REVIEW",
    fields: [
      {
        name: "reason",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity.",
      },
      {
        name: "requestedChanges",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Nội dung cần sửa; bắt buộc khi yêu cầu chỉnh sửa.",
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
      submissionId: z
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
      requestedChanges: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: z.object({
    submission: SubmissionsSubmissionSchema,
    task: TasksTaskSchema,
  }),
});

export const listReviewQueueContract = endpoint({
  ...{
    name: "listReviewQueue",
    feature: "submissions",
    method: "GET",
    path: "/api/v1/review-queue",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "TASKS_REVIEW",
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
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(SubmissionsSubmissionSchema),
});
