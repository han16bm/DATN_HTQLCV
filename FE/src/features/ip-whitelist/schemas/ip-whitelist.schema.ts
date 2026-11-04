import { reasonSchema, refSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";

// IPv4/IPv6 đơn lẻ hoặc dải CIDR, ví dụ 10.0.0.0/24, ::1/128, 203.113.1.5.
export const cidrSchema = z
  .string()
  .trim()
  .max(64)
  .pipe(
    z.union([z.ipv4(), z.ipv6(), z.cidrv4(), z.cidrv6()], {
      error: "Nhập địa chỉ IP hoặc dải CIDR hợp lệ.",
    }),
  );
export const ipWhitelistEntrySchema = z.object({
  id: idSchema,
  version: z.number().int().safe().positive(),
  cidr: z.string().min(1),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  createdBy: refSchema.nullable(),
  updatedBy: refSchema.nullable(),
});
export const ipWhitelistSchema = z.object({
  enabled: z.boolean(),
  // Bật/tắt = PATCH /settings/{settingId} với If-Match settingVersion.
  settingId: idSchema,
  settingVersion: z.number().int().safe().positive(),
  currentIp: z.string(),
  entries: z.array(ipWhitelistEntrySchema),
});
const description = z.string().trim().max(500).nullable().optional();
export const createIpWhitelistEntrySchema = z
  .object({ cidr: cidrSchema, description })
  .strict();
export const updateIpWhitelistEntrySchema = z
  .object({
    cidr: cidrSchema.optional(),
    description,
    isActive: z.boolean().optional(),
    reason: reasonSchema.shape.reason.optional(),
  })
  .strict();
