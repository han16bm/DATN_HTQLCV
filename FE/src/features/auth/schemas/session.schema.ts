import { userSchema } from "@/features/users/schemas/user.schema";
import { projectRoleSchema } from "@/features/project-members/schemas/project-members.schema";
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
    systemRole: true,
  }),
  projectAccess: z.array(
    z.object({
      projectId: idSchema,
      projectRole: projectRoleSchema,
    }),
  ),
});
export const loginResponseSchema = z.object({
  session: sessionSchema,
  accessToken: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
  expiresAt: z.iso.datetime(),
});
export const logoutResultSchema = z.object({
  ok: z.literal(true),
});
