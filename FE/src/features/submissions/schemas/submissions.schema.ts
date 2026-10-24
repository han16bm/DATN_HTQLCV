// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { SharedPersonRefSchema } from "@/types/common";
export const SubmissionsApproveSchema = z
  .object({
    comment: z.string().trim().max(10000).optional(),
  })
  .strict();
export type SubmissionsApproveDTO = z.output<typeof SubmissionsApproveSchema>;

export const SubmissionsRevisionSchema = z
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
export type SubmissionsRevisionDTO = z.output<typeof SubmissionsRevisionSchema>;

export const SubmissionsSubmissionCreateSchema = z
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
        .refine((v) => /^https?:\/\//.test(v), "Chỉ nhận liên kết HTTP/HTTPS"),
    ),
    attachmentIds: z.array(z.string().trim()),
  })
  .strict();
export type SubmissionsSubmissionCreateDTO = z.output<
  typeof SubmissionsSubmissionCreateSchema
>;

export const SubmissionsSubmissionSchema = z
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
    links: z.array(z.string()),
    attachmentIds: z.array(z.string()),
    dueAtSnapshot: z.iso.datetime(),
    actualMinutesSnapshot: z.number().int().safe().min(0),
    status: z.enum(["PENDING", "ACCEPTED", "REVISION_REQUESTED"]),
    reviewedBy: z.string().nullable(),
    reviewedAt: z.iso.datetime().nullable(),
    reviewComment: z.string().nullable(),
    requestedChanges: z.string().nullable(),
    submitter: SharedPersonRefSchema,
    reviewer: SharedPersonRefSchema.nullable(),
  })
  .superRefine(checkProjection);
export type SubmissionsSubmissionDTO = z.output<
  typeof SubmissionsSubmissionSchema
>;
