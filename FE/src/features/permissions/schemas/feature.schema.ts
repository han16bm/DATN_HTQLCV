import { reasonSchema, refSchema } from "@/lib/validation/common.schema";
import { z } from "zod";

// Mã chức năng do BE seed; FE chỉ đọc, bật/tắt và gom vào nhóm quyền.
export const featureCodeSchema = z.string().trim().min(1).max(100);
export const featureSchema = z.object({
  code: featureCodeSchema,
  version: z.number().int().safe().positive(),
  name: z.string().min(1),
  description: z.string().nullable(),
  parentCode: featureCodeSchema.nullable(),
  isGroup: z.boolean(),
  scope: z.literal("SYSTEM").nullable(),
  path: z.string().nullable(),
  icon: z.string().nullable(),
  sortOrder: z.number().int().safe(),
  isActive: z.boolean(),
  updatedAt: z.iso.datetime(),
  updatedBy: refSchema.nullable(),
});
export const updateFeatureSchema = z
  .object({ isActive: z.boolean(), reason: reasonSchema.shape.reason })
  .strict();
