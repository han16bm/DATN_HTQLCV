// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { SharedPersonRefSchema, SharedEntityLabelSchema } from "@/types/common";
export const ProjectsProjectCreateSchema = z
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
export type ProjectsProjectCreateDTO = z.output<
  typeof ProjectsProjectCreateSchema
>;

export const ProjectsProjectStatusSchema = z.enum([
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);
export type ProjectsProjectStatusDTO = z.output<
  typeof ProjectsProjectStatusSchema
>;

export const ProjectsProjectListQuerySchema = z
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
    status: ProjectsProjectStatusSchema.optional(),
  })
  .strict();
export type ProjectsProjectListQueryDTO = z.output<
  typeof ProjectsProjectListQuerySchema
>;

export const ProjectsProjectPatchSchema = z
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
export type ProjectsProjectPatchDTO = z.output<
  typeof ProjectsProjectPatchSchema
>;

export const ProjectsProjectSchema = z
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
    status: ProjectsProjectStatusSchema,
    completedAt: z.iso.datetime().nullable(),
    cancelledAt: z.iso.datetime().nullable(),
    owner: SharedPersonRefSchema,
    unit: SharedEntityLabelSchema,
  })
  .superRefine(checkProjection);
export type ProjectsProjectDTO = z.output<typeof ProjectsProjectSchema>;
