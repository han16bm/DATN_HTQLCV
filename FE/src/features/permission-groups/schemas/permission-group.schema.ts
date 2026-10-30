import { listQuerySchema, reasonSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";

export const permissionFeatureSchema = z.enum([
  "USERS_MANAGE",
  "ORGANIZATION_MANAGE",
  "PROJECT_CREATE",
  "PROJECT_MANAGE",
  "MEMBERS_MANAGE",
  "TASKS_MANAGE",
  "ANALYTICS_VIEW",
  "ALERTS_MANAGE",
]);

export const createPermissionGroupSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    description: z.string().trim().max(2000).optional(),
    features: z.array(permissionFeatureSchema),
    memberIds: z.array(idSchema),
  })
  .strict();
export const permissionGroupMembersSchema = z
  .object({
    memberIds: z.array(idSchema),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export const updatePermissionGroupSchema = createPermissionGroupSchema
  .omit({ memberIds: true })
  .partial()
  .extend({
    name: createPermissionGroupSchema.shape.name,
    features: createPermissionGroupSchema.shape.features,
    reason: reasonSchema.shape.reason,
  });
export const permissionGroupSchema = z.object({
  id: idSchema,
  version: z.number().int().safe().positive(),
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  description: z.string().nullable(),
  features: z.array(permissionFeatureSchema),
  memberIds: z.array(idSchema),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export const permissionGroupQuerySchema = z
  .object({ ...listQuerySchema.shape })
  .strict();
