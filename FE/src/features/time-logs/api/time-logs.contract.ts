// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import { LogsTimeLogSchema } from "../schemas/time-logs.schema";
import { TasksTaskSchema } from "@/features/tasks";
import { page } from "@/types/common";
export const listTimeLogsContract = endpoint({
  ...{
    name: "listTimeLogs",
    feature: "time-logs",
    method: "GET",
    path: "/api/v1/tasks/:taskId/time-logs",
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
  response: page(LogsTimeLogSchema),
});

export const createTimeLogContract = endpoint({
  ...{
    name: "createTimeLog",
    feature: "time-logs",
    method: "POST",
    path: "/api/v1/tasks/:taskId/time-logs",
    version: true,
    idempotency: true,
    invalidates: [
      "time-logs",
      "tasks",
      "reports",
      "report-preview",
      "analytics",
    ],
    permission: null,
    fields: [
      {
        name: "workDate",
        type: "string · YYYY-MM-DD",
        required: true,
        rules: "Ngày làm việc YYYY-MM-DD theo Asia/Ho_Chi_Minh.",
      },
      {
        name: "minutes",
        type: "integer",
        required: true,
        rules:
          "> 0; ≤ 1440; Phút nguyên dương; từng log ≤1440, tổng mọi log/người/ngày do BE kiểm tra.",
      },
      {
        name: "description",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 2000; Mô tả; task nhận null để bỏ mô tả.",
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
      workDate: z.iso.date(),
      minutes: z.number().int().safe().max(1440).positive(),
      description: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: z.object({
    timeLog: LogsTimeLogSchema,
    task: TasksTaskSchema,
  }),
});

export const updateTimeLogContract = endpoint({
  ...{
    name: "updateTimeLog",
    feature: "time-logs",
    method: "PATCH",
    path: "/api/v1/time-logs/:timeLogId",
    version: true,
    idempotency: true,
    invalidates: [
      "time-logs",
      "tasks",
      "reports",
      "report-preview",
      "analytics",
    ],
    permission: null,
    fields: [
      {
        name: "workDate",
        type: "string · YYYY-MM-DD",
        required: false,
        rules: "Ngày làm việc YYYY-MM-DD theo Asia/Ho_Chi_Minh.",
      },
      {
        name: "minutes",
        type: "integer",
        required: false,
        rules:
          "> 0; ≤ 1440; Phút nguyên dương; từng log ≤1440, tổng mọi log/người/ngày do BE kiểm tra.",
      },
      {
        name: "description",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 2000; Mô tả; task nhận null để bỏ mô tả.",
      },
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
      timeLogId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      workDate: z.iso.date().optional(),
      minutes: z.number().int().safe().max(1440).positive().optional(),
      description: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000)
        .optional(),
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: z.object({
    timeLog: LogsTimeLogSchema,
    task: TasksTaskSchema,
  }),
});

export const voidTimeLogContract = endpoint({
  ...{
    name: "voidTimeLog",
    feature: "time-logs",
    method: "POST",
    path: "/api/v1/time-logs/:timeLogId/void",
    version: true,
    idempotency: true,
    invalidates: [
      "time-logs",
      "tasks",
      "reports",
      "report-preview",
      "analytics",
    ],
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
      timeLogId: z
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
  response: z.object({
    timeLog: LogsTimeLogSchema,
    task: TasksTaskSchema,
  }),
});
