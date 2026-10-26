import {
  listQuerySchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const projectRoleSchema = z.enum(["OWNER", "MANAGER", "MEMBER"]);
export const addMemberSchema = z
  .object({
    userId: idSchema,
    projectRole: projectRoleSchema.exclude(["OWNER"]),
  })
  .strict();
export const memberRoleSchema = z
  .object({
    projectRole: projectRoleSchema.exclude(["OWNER"]),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export const membershipSchema = z
  .object({
    id: idSchema,
    version: z.number().int().safe().positive(),
    userId: idSchema,
    projectRole: projectRoleSchema,
    endedAt: z.iso.datetime().nullable(),
    user: personRefSchema,
  })
  .superRefine(checkProjection);
export const projectMemberQuerySchema = z
  .object({ ...listQuerySchema.shape })
  .strict();
