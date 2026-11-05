import { reasonSchema, refSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";

// Cấu hình tập trung (SystemConfigs, ADMIN_MODULES 4): một cột giá trị duy nhất.
export const serviceTypeSchema = z.enum([
  "Global",
  "Gateway",
  "Identity.Api",
  "Projects.Api",
  "Tasks.Api",
  "Analytics.Api",
]);
export const configDataTypeSchema = z.enum(["INT", "BOOL", "STRING"]);
export const settingQuerySchema = z
  .object({
    serviceType: serviceTypeSchema.optional(),
    group: z.string().trim().min(1).max(50).optional(),
    q: z
      .string()
      .trim()
      .max(255)
      .optional()
      .transform((value) => value || undefined),
  })
  .strict();
export const settingSchema = z.object({
  id: idSchema,
  version: z.number().int().safe().positive(),
  key: z.string().min(1).max(200),
  serviceType: serviceTypeSchema,
  group: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  dataType: configDataTypeSchema,
  value: z.string(),
  isActive: z.boolean(),
  // Tính từ ConfigCatalog của BE, không phải cột DB.
  known: z.boolean(),
  requiresRestart: z.boolean(),
  minValue: z.number().nullable(),
  maxValue: z.number().nullable(),
  allowedValues: z.array(z.string()).nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  updatedBy: refSchema.nullable(),
  createdBy: refSchema.nullable(),
  // Cấu hình bí mật (ví dụ Cloudinary API secret): BE lưu mã hoá, value luôn rỗng, secretSet = đã nhập.
  secret: z.boolean().optional(),
  secretSet: z.boolean().optional(),
});
const required = (max: number) =>
  z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(max);
export const createSettingSchema = z
  .object({
    key: required(200),
    serviceType: serviceTypeSchema,
    group: required(50),
    name: required(255),
    description: z.string().trim().max(2000).nullable().optional(),
    dataType: configDataTypeSchema,
    value: z.string().max(4000),
  })
  .strict();
export const updateSettingSchema = z
  .object({
    value: z.string().max(4000).optional(),
    name: required(255).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    isActive: z.boolean().optional(),
    reason: reasonSchema.shape.reason,
  })
  .strict();
