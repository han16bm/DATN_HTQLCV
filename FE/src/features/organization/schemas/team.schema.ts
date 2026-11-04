import {
  entityLabelSchema,
  listQuerySchema,
  reasonSchema,
  stampShape,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const createTeamSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    unitId: idSchema,
    memberIds: z.array(idSchema),
  })
  .strict();
export const teamMembersSchema = z
  .object({
    memberIds: z.array(idSchema),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export const updateTeamSchema = createTeamSchema
  .omit({ memberIds: true })
  .partial()
  .extend({ reason: reasonSchema.shape.reason });
export const teamSchema = z.object({
  id: idSchema,
  version: z.number().int().safe().positive(),
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  unitId: idSchema,
  memberIds: z.array(idSchema),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  ...stampShape,
});
export const teamQuerySchema = z
  .object({ ...listQuerySchema.shape, unitId: idSchema.optional() })
  .strict();

export const teamRowSchema = z
  .object(teamSchema.shape)
  .pick({ id: true, name: true, status: true })
  .extend({ unit: entityLabelSchema, memberCount: z.number().int().min(0) });
