import { checkAction } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const page = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    pagination: z.object({
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1).max(100),
      total: z.number().int().min(0),
    }),
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
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
});
export const personRefSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  displayName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
});
export const auditSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  entityType: z.string(),
  entityId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  actorId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  action: z.string(),
  at: z.iso.datetime(),
  before: z.json().nullable(),
  after: z.json().nullable(),
  reason: z.string().nullable(),
});
export const analysisSubjectSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("TASK"), taskId: z.string().min(1).max(100) })
    .strict(),
  z
    .object({ kind: z.literal("PERSON"), userId: z.string().min(1).max(100) })
    .strict(),
  z
    .object({
      kind: z.literal("PROJECT"),
      projectId: z.string().min(1).max(100),
    })
    .strict(),
  z
    .object({
      kind: z.literal("PROCESS"),
      projectId: z.string().min(1).max(100),
      stage: z.enum(["TODO", "IN_PROGRESS", "PENDING_REVIEW"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("METRIC"),
      metricCode: z.string().min(1).max(100),
    })
    .strict(),
  z
    .object({ kind: z.literal("UNIT"), unitId: z.string().min(1).max(100) })
    .strict(),
]);
export const analysisRefSchema = z.object({
  analysisId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  snapshotId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  analysisType: z.enum(["RISK", "WORKLOAD", "BOTTLENECK", "SUMMARY", "METRIC"]),
  subject: analysisSubjectSchema,
  title: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  dataAsOf: z.iso.datetime(),
  explanationStatus: z.enum([
    "NOT_REQUESTED",
    "QUEUED",
    "RUNNING",
    "READY",
    "FAILED",
    "UNAVAILABLE",
  ]),
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
    taskId: z.string().nullable(),
    submissionId: z.string().nullable(),
    reportId: z.string().nullable(),
  })
  .superRefine(checkAction);
