import { entityLabelSchema } from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const systemRoleSchema = z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]);
export const userStatusSchema = z.enum(["ACTIVE", "LOCKED"]);
export const userQuerySchema = z
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
    systemRole: systemRoleSchema.optional(),
    status: userStatusSchema.optional(),
  })
  .strict();
export const userSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    username: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
    displayName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    email: z.string().email(),
    unitId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    systemRole: systemRoleSchema,
    status: userStatusSchema,
    unit: entityLabelSchema,
  })
  .superRefine(checkProjection);
