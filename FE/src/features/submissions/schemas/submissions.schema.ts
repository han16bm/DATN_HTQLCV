import { taskSchema } from "@/features/tasks/schemas/task.schema";
import {
  listQuerySchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
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
    attachmentIds: z.array(idSchema).max(10),
  })
  .strict();
export const submissionSchema = z
  .object({
    id: idSchema,
    version: z.number().int().safe().positive(),
    taskId: idSchema,
    sequence: z.number().int().safe().positive(),
    submittedBy: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    submittedAt: z.iso.datetime(),
    summary: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(2000),
    links: z.array(
      z
        .string()
        .url()
        .refine(
          (v) => /^https?:\/\//.test(v),
          "Vui lòng nhập liên kết đầy đủ, ví dụ https://example.com.",
        ),
    ),
    attachmentIds: z.array(idSchema),
    dueAtSnapshot: z.iso.datetime(),
    actualMinutesSnapshot: z.number().int().safe().min(0),
    status: z.enum(["PENDING", "ACCEPTED", "REVISION_REQUESTED"]),
    reviewedAt: z.iso.datetime().nullable(),
    reviewComment: z.string().nullable(),
    requestedChanges: z.string().nullable(),
    submitter: personRefSchema,
    reviewer: personRefSchema.nullable(),
  })
  .superRefine(checkProjection);
export const submissionQuerySchema = z
  .object({ ...listQuerySchema.shape })
  .strict();
export const submissionResultSchema = z.object({
  submission: submissionSchema,
  task: taskSchema,
});
export const reviewQueueQuerySchema = z
  .object({ ...listQuerySchema.shape, projectId: idSchema.optional() })
  .strict();

export const submissionRowSchema = z.object(submissionSchema.shape).pick({
  id: true,
  sequence: true,
  submitter: true,
  submittedAt: true,
  status: true,
});

export const reviewRowSchema = z
  .object(submissionSchema.shape)
  .pick({
    id: true,
    taskId: true,
    sequence: true,
    submitter: true,
    submittedAt: true,
    dueAtSnapshot: true,
  })
  .extend({ taskTitle: z.string().min(1).max(255) });
