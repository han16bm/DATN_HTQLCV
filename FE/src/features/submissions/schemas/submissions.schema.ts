import { taskSchema } from "@/features/tasks/schemas/task.schema";
import { personRefSchema } from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const approveSchema = z
  .object({
    comment: z.string().trim().max(10000).optional(),
  })
  .strict();
export const revisionSchema = z
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
  .strict();
export const createSubmissionSchema = z
  .object({
    summary: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
    links: z
      .array(
        z
          .string()
          .trim()
          .url()
          .refine(
            (v) => /^https?:\/\//.test(v),
            "Chỉ nhận liên kết HTTP/HTTPS",
          ),
      )
      .max(10),
    attachmentIds: z.array(z.string().trim()).max(10),
  })
  .strict();
export const submissionSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    taskId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    sequence: z.number().int().safe().positive(),
    submittedBy: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    submittedAt: z.iso.datetime(),
    summary: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
    links: z.array(
      z
        .string()
        .url()
        .refine((v) => /^https?:\/\//.test(v), "Chỉ nhận liên kết HTTP/HTTPS"),
    ),
    attachmentIds: z.array(z.string()),
    dueAtSnapshot: z.iso.datetime(),
    actualMinutesSnapshot: z.number().int().safe().min(0),
    status: z.enum(["PENDING", "ACCEPTED", "REVISION_REQUESTED"]),
    reviewedBy: z.string().nullable(),
    reviewedAt: z.iso.datetime().nullable(),
    reviewComment: z.string().nullable(),
    requestedChanges: z.string().nullable(),
    submitter: personRefSchema,
    reviewer: personRefSchema.nullable(),
  })
  .superRefine(checkProjection);
export const submissionQuerySchema = z
  .object({
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
  })
  .strict();
export const submissionResultSchema = z.object({
  submission: submissionSchema,
  task: taskSchema,
});
export const reviewQueueQuerySchema = z
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
  .strict();
