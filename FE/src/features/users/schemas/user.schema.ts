import {
  entityLabelSchema,
  listQuerySchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { affiliationsSchema, personalInfoSchema } from "./personal-info.schema";
export const systemRoleSchema = z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]);
export const userStatusSchema = z.enum(["ACTIVE", "LOCKED"]);
export const userQuerySchema = z
  .object({
    ...listQuerySchema.shape,
    unitId: idSchema.optional(),
    systemRole: systemRoleSchema.optional(),
    status: userStatusSchema.optional(),
  })
  .strict();
export const userSchema = z
  .object({
    ...personalInfoSchema.shape,
    ...affiliationsSchema.shape,
    id: idSchema,
    version: z.number().int().safe().positive(),
    updatedAt: z.iso.datetime(),
    username: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
    displayName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    email: z.string().email(),
    avatarUrl: z.string().min(1).nullable(),
    unitId: idSchema,
    systemRole: systemRoleSchema,
    status: userStatusSchema,
    unit: entityLabelSchema,
  })
  .superRefine(checkProjection);

export const userRowSchema = z.object(userSchema.shape).pick({
  id: true,
  username: true,
  displayName: true,
  email: true,
  avatarUrl: true,
  unitId: true,
  systemRole: true,
  status: true,
  unit: true,
});
