import { type z } from "zod";
import type { loginSchema } from "../schemas/login.schema";
import type {
  changePasswordSchema,
  passwordResultSchema,
} from "../schemas/password.schema";
import type { personalProfileSchema, updateProfileSchema } from "../schemas/profile.schema";
import type {
  loginResponseSchema,
  logoutResultSchema,
  sessionSchema,
} from "../schemas/session.schema";
export type SessionDto = z.output<typeof sessionSchema>;
export type PersonalProfileDto = z.output<typeof personalProfileSchema>;
export type LoginResponse = z.output<typeof loginResponseSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type LogoutResult = z.output<typeof logoutResultSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ChangePasswordResult = z.output<typeof passwordResultSchema>;
export type UpdateProfileInput = z.output<typeof updateProfileSchema>;
export type UpdateProfileArgs = {
  payload: UpdateProfileInput;
  version: number;
};
