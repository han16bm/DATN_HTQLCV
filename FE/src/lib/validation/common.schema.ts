import { checkAction } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
// Hành động được phép; phạm vi (hệ thống hoặc từng dự án) do session quyết định.
export const permissionSchema = z.enum([
  "USERS_MANAGE",
  "ORGANIZATION_MANAGE",
  "PROJECT_CREATE",
  "PROJECT_MANAGE",
  "MEMBERS_MANAGE",
  "TASKS_MANAGE",
  "TASKS_REVIEW",
  "ANALYTICS_VIEW",
  "ALERTS_MANAGE",
]);
export const paginationSchema = z.object({
  page: z.number().int().safe().min(1),
  pageSize: z.number().int().safe().min(1).max(100),
  total: z.number().int().safe().min(0),
});
export const listQuerySchema = z
  .object({
    page: paginationSchema.shape.page.default(1),
    pageSize: paginationSchema.shape.pageSize.default(20),
    q: z
      .string()
      .trim()
      .max(255)
      .optional()
      .transform((value) => value || undefined),
  })
  .strict();
export const page = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    pagination: paginationSchema,
  });
export const reasonSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export const entityLabelSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
});
export const personRefSchema = z.object({
  id: idSchema,
  displayName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
});
export const auditSchema = z.object({
  id: idSchema,
  actor: personRefSchema,
  action: z.string(),
  at: z.iso.datetime(),
  before: z.json().nullable(),
  after: z.json().nullable(),
  reason: z.string().nullable(),
});
export const analysisSubjectSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("TASK"), taskId: idSchema }).strict(),
  z.object({ kind: z.literal("PERSON"), userId: idSchema }).strict(),
  z
    .object({
      kind: z.literal("PROJECT"),
      projectId: idSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("PROCESS"),
      projectId: idSchema,
      stage: z.enum(["TODO", "IN_PROGRESS", "PENDING_REVIEW"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("METRIC"),
      metricCode: z.string().min(1).max(100),
    })
    .strict(),
  z.object({ kind: z.literal("UNIT"), unitId: idSchema }).strict(),
]);
export const analysisRefSchema = z.object({
  analysisId: idSchema,
});
export const domainActionSchema = z
  .object({
    target: z.enum([
      "TASK_DETAIL",
      "TASK_PLAN",
      "TASK_ASSIGNMENT",
      "SUBMISSION_REVIEW",
      "REVIEW_QUEUE",
      "REPORT_DETAIL",
    ]),
    taskId: idSchema.nullable(),
    submissionId: idSchema.nullable(),
    reportId: idSchema.nullable(),
  })
  .superRefine(checkAction);
