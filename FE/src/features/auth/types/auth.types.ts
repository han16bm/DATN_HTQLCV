import type { loginSchema } from "@/features/auth/schemas/login.schema";
import type {
  logoutResultSchema,
  sessionSchema,
} from "@/features/auth/schemas/session.schema";
import { type z } from "zod";
export type SessionDto = z.output<typeof sessionSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type LogoutResult = z.output<typeof logoutResultSchema>;
