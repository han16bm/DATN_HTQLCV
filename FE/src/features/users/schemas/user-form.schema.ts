import { systemRoleSchema } from "@/features/users/schemas/user.schema";
import { z } from "zod";
export const resetPasswordSchema = z
  .object({
    temporaryPassword: z
      .string()
      .min(8, "Vui lòng nhập thông tin bắt buộc")
      .max(128),
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
      .min(3, "Vui lòng nhập thông tin bắt buộc")
      .max(64)
      .regex(/^[a-zA-Z0-9._-]+$/),
    displayName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(255),
    email: z.string().trim().toLowerCase().email(),
    unitId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    systemRole: systemRoleSchema,
    initialPassword: z
      .string()
      .min(8, "Vui lòng nhập thông tin bắt buộc")
      .max(128),
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
export const updateUserSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(255)
      .optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    unitId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .optional(),
    systemRole: systemRoleSchema.optional(),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
  })
  .strict();
export const resetUserPasswordResultSchema = z.object({
  ok: z.literal(true),
});
