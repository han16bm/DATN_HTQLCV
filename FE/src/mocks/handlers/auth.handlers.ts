import { loginSchema } from "@/features/auth/schemas/login.schema";
import {
  loginResponseSchema,
  logoutResultSchema,
  sessionSchema,
} from "@/features/auth/schemas/session.schema";
import { emptySchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { authDb } from "../db/auth.db";
import { mockHandler, mockJson } from "../utils/handler";
const accessToken = (request: Request) =>
  request.headers.get("Authorization")?.replace(/^Bearer /, "");
export const authHandlers = [
  http.post(
    "*/api/v1/auth/login",
    mockHandler(async ({ request }) => {
      const payload = loginSchema.parse(await request.json());
      const result = authDb.login(payload);
      return mockJson(request, result, loginResponseSchema, 200, {
        "Set-Cookie": `mock_refresh=${result.session.user.id}; Path=/; SameSite=Lax`,
      });
    }),
  ),
  http.post(
    "*/api/v1/auth/refresh",
    mockHandler(async ({ request, cookies }) => {
      emptySchema.parse(await request.json());
      const result = authDb.refresh(cookies.mock_refresh);
      return mockJson(request, result, loginResponseSchema, 200, {
        "Set-Cookie": `mock_refresh=${result.session.user.id}; Path=/; SameSite=Lax`,
      });
    }),
  ),
  http.get(
    "*/api/v1/auth/me",
    mockHandler(({ request }) =>
      mockJson(request, authDb.getSession(accessToken(request)), sessionSchema),
    ),
  ),
  http.post(
    "*/api/v1/auth/logout",
    mockHandler(async ({ request }) => {
      emptySchema.parse(await request.json());
      return mockJson(
        request,
        authDb.logout(accessToken(request)),
        logoutResultSchema,
        200,
        { "Set-Cookie": "mock_refresh=; Path=/; Max-Age=0; SameSite=Lax" },
      );
    }),
  ),
];
