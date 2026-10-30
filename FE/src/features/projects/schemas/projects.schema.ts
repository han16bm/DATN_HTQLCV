import {
  entityLabelSchema,
  listQuerySchema,
  personRefSchema,
  reasonSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const createProjectSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(32)
      .regex(/^[A-Z0-9_-]+$/),
    name: z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    objective: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
    unitId: idSchema,
    ownerId: idSchema,
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
    ...listQuerySchema.shape,
    unitId: idSchema.optional(),
    status: projectStatusSchema.optional(),
  })
  .strict();
export const updateProjectSchema = createProjectSchema
  .omit({ code: true, unitId: true })
  .partial()
  .extend({ changeReason: reasonSchema.shape.reason });
export const projectSchema = z
  .object({
    id: idSchema,
    version: z.number().int().safe().positive(),
    code: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
    name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    objective: z.string().max(10000),
    ownerId: idSchema,
    startDate: z.iso.date(),
    dueAt: z.iso.datetime(),
    status: projectStatusSchema,
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
  .object({ ...listQuerySchema.shape })
  .strict();

export const projectRowSchema = z.object(projectSchema.shape).pick({
  id: true,
  name: true,
  startDate: true,
  dueAt: true,
  status: true,
  owner: true,
  unit: true,
});
