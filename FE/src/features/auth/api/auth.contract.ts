import {
  type LoginInput,
  type LogoutResult,
  type SessionDto,
} from "@/features/auth/types/auth.types";
import type { RequestOptions } from "@/services/api.types";
export interface AuthApi {
  login(payload: LoginInput, options?: RequestOptions): Promise<SessionDto>;
  logout(options?: RequestOptions): Promise<LogoutResult>;
  refreshSession(options?: RequestOptions): Promise<SessionDto>;
  getSession(options?: RequestOptions): Promise<SessionDto>;
}
