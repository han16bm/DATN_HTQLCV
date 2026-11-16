import {
  listQuerySchema,
  reasonSchema,
  refSchema,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";

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

export const ipAccessLogStatusSchema = z.enum([
  "PENDING",
  "ALLOWED",
  "DISMISSED",
]);
export const ipAccessLogSchema = z.object({
  id: idSchema,
  version: z.number().int().safe().positive(),
  ip: z.string().min(1),
  scope: z.enum(["ADMIN", "SYSTEM"]),
  firstSeenAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime(),
  hitCount: z.number().int().safe().min(0),
  blockedCount: z.number().int().safe().min(0),
  lastUser: refSchema.nullable(),
  lastUsername: z.string().nullable(),
  lastPath: z.string(),
  status: ipAccessLogStatusSchema,
  resolvedBy: refSchema.nullable(),
  resolvedAt: z.iso.datetime().nullable(),
  resolveNote: z.string().nullable(),
});
export const ipAccessLogQuerySchema = listQuerySchema
  .pick({ page: true, pageSize: true, q: true })
  .extend({
    status: ipAccessLogStatusSchema.optional(),
    scope: z.enum(["ADMIN", "SYSTEM"]).optional(),
  })
  .strict();
export const allowIpAccessLogSchema = z
  .object({
    cidr: cidrSchema.optional(),
    description,
    reason: reasonSchema.shape.reason,
  })
  .strict();
export const dismissIpAccessLogSchema = reasonSchema;
export const allowIpAccessLogResultSchema = z.object({
  log: ipAccessLogSchema,
  entry: ipWhitelistEntrySchema,
});
