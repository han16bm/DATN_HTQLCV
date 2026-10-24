import { z } from "zod";
export const createUnitSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    parentId: z.string().trim().nullable(),
    managerId: z.string().trim().nullable(),
  })
  .strict();
export const updateUnitSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(255)
      .optional(),
    parentId: z.string().trim().nullable().optional(),
    managerId: z.string().trim().nullable().optional(),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export const unitQuerySchema = z
  .object({
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .strict();
export const unitSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  version: z.number().int().safe().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  parentId: z.string().nullable(),
  managerId: z.string().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
