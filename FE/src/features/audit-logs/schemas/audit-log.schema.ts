import { listQuerySchema, refSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";

export const auditLogQuerySchema = z
  .object({
    ...listQuerySchema.shape,
    entityType: z.string().trim().min(1).max(100).optional(),
    actorId: idSchema.optional(),
    action: z.string().trim().min(1).max(255).optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .strict();
export const auditLogRowSchema = z.object({
  id: idSchema,
  at: z.iso.datetime(),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  action: z.string(),
  actor: refSchema,
  reason: z.string().nullable(),
});
export const auditLogSchema = auditLogRowSchema.extend({
  before: z.json().nullable(),
  after: z.json().nullable(),
});
