import {
  listQuerySchema,
  reasonSchema,
  refSchema,
  stampShape,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
import { featureCodeSchema } from "./feature.schema";

export const groupStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const permissionGroupQuerySchema = z
  .object({ ...listQuerySchema.shape, status: groupStatusSchema.optional() })
  .strict();
export const permissionGroupSchema = z.object({
  id: idSchema,
  version: z.number().int().safe().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  features: z.array(featureCodeSchema),
  memberIds: z.array(idSchema),
  members: z.array(refSchema),
  status: groupStatusSchema,
  isSystem: z.boolean(),
  ...stampShape,
});
const name = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập thông tin bắt buộc")
  .max(255);
const description = z.string().trim().max(2000).nullable().optional();
export const createPermissionGroupSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100)
      .regex(/^[A-Z0-9_]+$/, "Mã chỉ gồm chữ in hoa, số và dấu gạch dưới."),
    name,
    description,
    features: z.array(featureCodeSchema),
    memberIds: z.array(idSchema),
  })
  .strict();
export const updatePermissionGroupSchema = z
  .object({
    name: name.optional(),
    description,
    features: z.array(featureCodeSchema).optional(),
    reason: reasonSchema.shape.reason.optional(),
  })
  .strict();
export const permissionGroupMembersSchema = z
  .object({
    memberIds: z.array(idSchema),
    reason: reasonSchema.shape.reason.optional(),
  })
  .strict();
