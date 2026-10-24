import {
  entityLabelSchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const createProjectSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Vui lòng nhập thông tin bắt buộc")
      .max(32)
      .regex(/^[A-Z0-9_-]+$/),
    name: z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
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
  .strict();
export const projectStatusSchema = z.enum([
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);
export const projectQuerySchema = z
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
    status: projectStatusSchema.optional(),
  })
  .strict();
export const updateProjectSchema = z
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
  .strict();
export const projectSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    code: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
    name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    objective: z.string().max(10000),
    unitId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    ownerId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    startDate: z.iso.date(),
    dueAt: z.iso.datetime(),
    status: projectStatusSchema,
    completedAt: z.iso.datetime().nullable(),
    cancelledAt: z.iso.datetime().nullable(),
    owner: personRefSchema,
    unit: entityLabelSchema,
  })
  .superRefine(checkProjection);
export const getProjectClosureChecksResultSchema = z.object({
  openTaskCount: z.number().int().safe().min(0),
  pendingReviewCount: z.number().int().safe().min(0),
  pendingReportCount: z.number().int().safe().min(0),
  canClose: z.boolean(),
});
export const projectHistoryQuerySchema = z
  .object({
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
  })
  .strict();
