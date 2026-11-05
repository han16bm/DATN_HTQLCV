import {
  entityLabelSchema,
  listQuerySchema,
  refSchema,
  stampShape,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { affiliationsSchema, personalInfoSchema } from "./personal-info.schema";
export const userStatusSchema = z.enum(["ACTIVE", "LOCKED"]);
export const userQuerySchema = z
  .object({
    ...listQuerySchema.shape,
    unitId: idSchema.optional(),
    groupId: idSchema.optional(),
    isSysAdmin: z.boolean().optional(),
    status: userStatusSchema.optional(),
  })
  .strict();
export const userSchema = z
  .object({
    ...personalInfoSchema.shape,
    ...affiliationsSchema.shape,
    id: idSchema,
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    username: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
    displayName: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    email: z.string().email(),
    avatarUrl: z.string().min(1).nullable(),
    unitId: idSchema,
    isSysAdmin: z.boolean(),
    // Nhóm quyền đang hoạt động mà người dùng thuộc về.
    groups: z.array(refSchema),
    status: userStatusSchema,
    unit: entityLabelSchema,
    ...stampShape,
  })
  .superRefine(checkProjection);

export const userRowSchema = z.object(userSchema.shape).pick({
  id: true,
  username: true,
  displayName: true,
  email: true,
  avatarUrl: true,
  unitId: true,
  isSysAdmin: true,
  groups: true,
  status: true,
  unit: true,
});
