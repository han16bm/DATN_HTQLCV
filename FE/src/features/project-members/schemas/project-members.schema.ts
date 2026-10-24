import {
  listQuerySchema,
  permissionSchema,
  personRefSchema,
} from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const addMemberSchema = z
  .object({
    userId: idSchema,
    projectRole: z.enum(["MANAGER", "MEMBER"]),
    permissions: z.array(permissionSchema),
  })
  .strict();
export const memberPermissionsSchema = z
  .object({
    projectRole: z.enum(["MANAGER", "MEMBER"]),
    permissions: z.array(permissionSchema),
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
    projectRole: z.enum(["OWNER", "MANAGER", "MEMBER"]),
    permissions: z.array(permissionSchema),
    endedAt: z.iso.datetime().nullable(),
    user: personRefSchema,
  })
  .superRefine(checkProjection);
export const projectMemberQuerySchema = z
  .object({ ...listQuerySchema.shape })
  .strict();
