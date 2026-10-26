import { reasonSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { systemRoleSchema } from "./user.schema";
export const resetPasswordSchema = z
  .object({
    temporaryPassword: z.string().min(8).max(128),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export const createUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .regex(/^[a-zA-Z0-9._-]+$/),
    displayName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(255),
    email: z.string().trim().toLowerCase().email(),
    unitId: idSchema,
    systemRole: systemRoleSchema,
    initialPassword: z.string().min(8).max(128),
  })
  .strict();
export const userLockSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
    mode: z.enum(["NORMAL", "EMERGENCY"]),
  })
  .strict();
export const updateUserSchema = createUserSchema
  .omit({ username: true, initialPassword: true })
  .partial()
  .extend({ reason: reasonSchema.shape.reason.optional() });
export const resetUserPasswordResultSchema = z.object({
  ok: z.literal(true),
});
