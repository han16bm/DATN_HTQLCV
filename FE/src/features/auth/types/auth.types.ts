import type { loginSchema } from "@/features/auth/schemas/login.schema";
import type {
  changePasswordSchema,
  passwordResultSchema,
} from "@/features/auth/schemas/password.schema";
import type { updateProfileSchema } from "@/features/auth/schemas/profile.schema";
import type {
  logoutResultSchema,
  sessionSchema,
} from "@/features/auth/schemas/session.schema";
import { type z } from "zod";
export type SessionDto = z.output<typeof sessionSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type LogoutResult = z.output<typeof logoutResultSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ChangePasswordResult = z.output<typeof passwordResultSchema>;
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type UpdateProfileArgs = {
  payload: UpdateProfileInput;
  version: number;
};
