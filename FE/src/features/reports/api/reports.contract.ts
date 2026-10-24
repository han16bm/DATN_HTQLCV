// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  ReportsPeriodTypeSchema,
  ReportsReportSchema,
  ReportsReportPreviewSchema,
} from "../schemas/reports.schema";

import { page } from "@/types/common";
export const listReportsContract = endpoint({
  ...{
    name: "listReports",
    feature: "reports",
    method: "GET",
    path: "/api/v1/reports",
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
      authorId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      periodType: ReportsPeriodTypeSchema.optional(),
      status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(ReportsReportSchema),
});

export const getReportPreviewContract = endpoint({
  ...{
    name: "getReportPreview",
    feature: "reports",
    method: "GET",
    path: "/api/v1/report-previews",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
    .object({
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      periodType: ReportsPeriodTypeSchema,
      periodStart: z.iso.date(),
    })
    .strict(),
  body: z.object({}).strict(),
  response: ReportsReportPreviewSchema,
});

export const getReportContract = endpoint({
  ...{
    name: "getReport",
    feature: "reports",
    method: "GET",
    path: "/api/v1/reports/:reportId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      reportId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: ReportsReportSchema,
});

export const createReportDraftContract = endpoint({
  ...{
    name: "createReportDraft",
    feature: "reports",
    method: "POST",
    path: "/api/v1/reports",
    version: false,
    idempotency: true,
    invalidates: ["reports"],
    permission: null,
    fields: [
      {
        name: "projectId",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 100; ID dự án; không đồng nghĩa ID service.",
      },
      {
        name: "periodType",
        type: "Reports.PeriodTypeDTO",
        required: true,
        rules: "DAILY hoặc WEEKLY; tuần từ thứ Hai theo Việt Nam.",
      },
      {
        name: "periodStart",
        type: "string · YYYY-MM-DD",
        required: true,
        rules: "Ngày đầu kỳ, không ở tương lai.",
      },
      {
        name: "achievements",
        type: "string",
        required: false,
        rules:
          "độ dài ≤ 10000; Kết quả thực hiện; nháp được rỗng, khi gửi phải có.",
      },
      {
        name: "blockers",
        type: "string",
        required: false,
        rules: "độ dài ≤ 10000; Khó khăn cần ghi nhận, được rỗng.",
      },
      {
        name: "nextPlan",
        type: "string",
        required: false,
        rules:
          "độ dài ≤ 10000; Kế hoạch tiếp theo; nháp được rỗng, khi gửi phải có.",
      },
      {
        name: "selectedTaskIds",
        type: "array<string>",
        required: false,
        rules:
          "ID công việc liên quan đúng tác giả/dự án/kỳ, không gửi object công việc.",
      },
    ],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      periodType: ReportsPeriodTypeSchema,
      periodStart: z.iso.date(),
      achievements: z.string().trim().max(10000).optional(),
      blockers: z.string().trim().max(10000).optional(),
      nextPlan: z.string().trim().max(10000).optional(),
      selectedTaskIds: z.array(z.string().trim()).optional(),
    })
    .strict(),
  response: ReportsReportSchema,
});

export const updateReportDraftContract = endpoint({
  ...{
    name: "updateReportDraft",
    feature: "reports",
    method: "PATCH",
    path: "/api/v1/reports/:reportId",
    version: true,
    idempotency: true,
    invalidates: ["reports"],
    permission: null,
    fields: [
      {
        name: "achievements",
        type: "string",
        required: false,
        rules:
          "độ dài ≤ 10000; Kết quả thực hiện; nháp được rỗng, khi gửi phải có.",
      },
      {
        name: "blockers",
        type: "string",
        required: false,
        rules: "độ dài ≤ 10000; Khó khăn cần ghi nhận, được rỗng.",
      },
      {
        name: "nextPlan",
        type: "string",
        required: false,
        rules:
          "độ dài ≤ 10000; Kế hoạch tiếp theo; nháp được rỗng, khi gửi phải có.",
      },
      {
        name: "selectedTaskIds",
        type: "array<string>",
        required: false,
        rules:
          "ID công việc liên quan đúng tác giả/dự án/kỳ, không gửi object công việc.",
      },
      {
        name: "zeroTimeReason",
        type: "string / null",
        required: false,
        rules: "Giải thích khi gửi báo cáo có tổng 0 phút.",
      },
    ],
  },
  params: z
    .object({
      reportId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      achievements: z.string().trim().max(10000).optional(),
      blockers: z.string().trim().max(10000).optional(),
      nextPlan: z.string().trim().max(10000).optional(),
      selectedTaskIds: z.array(z.string().trim()).optional(),
      zeroTimeReason: z.string().trim().nullable().optional(),
    })
    .strict(),
  response: ReportsReportSchema,
});

export const refreshReportDraftContract = endpoint({
  ...{
    name: "refreshReportDraft",
    feature: "reports",
    method: "POST",
    path: "/api/v1/reports/:reportId/refresh",
    version: true,
    idempotency: true,
    invalidates: ["report-preview"],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      reportId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: ReportsReportPreviewSchema,
});

export const submitReportContract = endpoint({
  ...{
    name: "submitReport",
    feature: "reports",
    method: "POST",
    path: "/api/v1/reports/:reportId/submit",
    version: true,
    idempotency: true,
    invalidates: ["reports", "report-preview", "analytics"],
    permission: null,
    fields: [
      {
        name: "zeroTimeReason",
        type: "string",
        required: false,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Giải thích khi gửi báo cáo có tổng 0 phút.",
      },
    ],
  },
  params: z
    .object({
      reportId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      zeroTimeReason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000)
        .optional(),
    })
    .strict(),
  response: ReportsReportSchema,
});
