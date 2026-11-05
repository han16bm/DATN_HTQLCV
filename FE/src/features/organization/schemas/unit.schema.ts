import {
  listQuerySchema,
  reasonSchema,
  stampShape,
} from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const createUnitSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    parentId: idSchema.nullable(),
    managerId: idSchema.nullable(),
  })
  .strict();
export const updateUnitSchema = createUnitSchema
  .partial()
  .extend({ reason: reasonSchema.shape.reason });
export const unitQuerySchema = z
  .object({
    ...listQuerySchema.shape,
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .strict();
export const unitSchema = z.object({
  id: idSchema,
  version: z.number().int().safe().positive(),
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  parentId: idSchema.nullable(),
  managerId: idSchema.nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  ...stampShape,
});

export const unitRowSchema = unitSchema.pick({
  id: true,
  name: true,
  status: true,
});
