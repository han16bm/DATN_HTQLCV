// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { UsersUserSchema } from "@/features/users";
export const AuthSessionSchema = z.object({
  user: UsersUserSchema,
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
export type AuthSessionDTO = z.output<typeof AuthSessionSchema>;

export const AuthLoginResponseSchema = z.object({
  session: AuthSessionSchema,
  accessToken: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
  expiresAt: z.iso.datetime(),
});
export type AuthLoginResponseDTO = z.output<typeof AuthLoginResponseSchema>;

export const AuthLoginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(64),
    password: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(128),
  })
  .strict();
export type AuthLoginDTO = z.output<typeof AuthLoginSchema>;
