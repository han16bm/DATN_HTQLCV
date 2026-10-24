// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { SharedEntityLabelSchema } from "@/types/common";
export const UsersResetPasswordSchema = z
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
export type UsersResetPasswordDTO = z.output<typeof UsersResetPasswordSchema>;

export const UsersSystemRoleSchema = z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]);
export type UsersSystemRoleDTO = z.output<typeof UsersSystemRoleSchema>;

export const UsersUserCreateSchema = z
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
    systemRole: UsersSystemRoleSchema,
    initialPassword: z
      .string()
      .min(8, "Vui lòng nhập thông tin bắt buộc")
      .max(128),
  })
  .strict();
export type UsersUserCreateDTO = z.output<typeof UsersUserCreateSchema>;

export const UsersUserStatusSchema = z.enum(["ACTIVE", "LOCKED"]);
export type UsersUserStatusDTO = z.output<typeof UsersUserStatusSchema>;

export const UsersUserListQuerySchema = z
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
    systemRole: UsersSystemRoleSchema.optional(),
    status: UsersUserStatusSchema.optional(),
  })
  .strict();
export type UsersUserListQueryDTO = z.output<typeof UsersUserListQuerySchema>;

export const UsersUserLockSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
    mode: z.enum(["NORMAL", "EMERGENCY"]),
  })
  .strict();
export type UsersUserLockDTO = z.output<typeof UsersUserLockSchema>;

export const UsersUserPatchSchema = z
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
    systemRole: UsersSystemRoleSchema.optional(),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000)
      .optional(),
  })
  .strict();
export type UsersUserPatchDTO = z.output<typeof UsersUserPatchSchema>;

export const UsersUserSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    username: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
    displayName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    email: z.string().email(),
    unitId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    systemRole: UsersSystemRoleSchema,
    status: UsersUserStatusSchema,
    unit: SharedEntityLabelSchema,
  })
  .superRefine(checkProjection);
export type UsersUserDTO = z.output<typeof UsersUserSchema>;
