import { userSchema } from "@/features/users/schemas/user.schema";
import { permissionSchema } from "@/lib/validation/common.schema";
import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const sessionSchema = z.object({
  user: z.object(userSchema.shape).pick({
    id: true,
    version: true,
    avatarUrl: true,
    displayName: true,
    username: true,
    email: true,
    unitId: true,
    unit: true,
    isSysAdmin: true,
    groups: true,
  }),
  projectAccess: z.array(
    z.object({
      projectId: idSchema,
      permissions: z.array(permissionSchema).default([]),
    }),
  ),
  permissions: z.array(permissionSchema).default([]),
});
export const loginResponseSchema = z.object({
  session: sessionSchema,
  accessToken: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
});
export const logoutResultSchema = z.object({
  ok: z.literal(true),
});
