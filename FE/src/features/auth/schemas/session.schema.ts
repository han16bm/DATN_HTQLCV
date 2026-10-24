import { userSchema } from "@/features/users/schemas/user.schema";
import { z } from "zod";
export const sessionSchema = z.object({
  user: userSchema,
  systemPermissions: z.array(
    z.enum([
      "USERS_MANAGE",
      "ORGANIZATION_MANAGE",
      "PROJECT_CREATE",
      "PROJECT_MANAGE",
      "MEMBERS_MANAGE",
      "TASKS_MANAGE",
      "TASKS_REVIEW",
      "ANALYTICS_VIEW",
      "ALERTS_MANAGE",
    ]),
  ),
  projectAccess: z.array(
    z.object({
      projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
      membershipId: z
        .string()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      permissions: z.array(
        z.enum([
          "USERS_MANAGE",
          "ORGANIZATION_MANAGE",
          "PROJECT_CREATE",
          "PROJECT_MANAGE",
          "MEMBERS_MANAGE",
          "TASKS_MANAGE",
          "TASKS_REVIEW",
          "ANALYTICS_VIEW",
          "ALERTS_MANAGE",
        ]),
      ),
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
