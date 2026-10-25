import { loginSchema } from "@/features/auth/schemas/login.schema";
import { updateProfileSchema } from "@/features/auth/schemas/profile.schema";
import {
  changePasswordSchema,
  passwordResultSchema,
} from "@/features/auth/schemas/password.schema";
import {
  loginResponseSchema,
  logoutResultSchema,
  sessionSchema,
} from "@/features/auth/schemas/session.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http, HttpResponse } from "msw";
import { authDb } from "../db";
import { authenticatedUser, mockCommand, mockHandler, mockJson } from "./http";
const accessToken = (request: Request) =>
  request.headers.get("Authorization")?.replace(/^Bearer /, "");
export const authHandlers = [
  http.put(
    "*/api/auth/me/password",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = changePasswordSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "changePassword",
          feature: "auth",
          viewer,
          permission: null,
          params: {},
          payload,
        },
        () =>
          mockJson(
            request,
            authDb.changePassword(viewer, payload),
            passwordResultSchema,
          ),
      );
    }),
  ),
  http.post(
    "*/api/auth/login",
    mockHandler(async ({ request }) => {
      const payload = loginSchema.parse(await request.json());
      const result = authDb.login(payload);
      return mockJson(request, result, loginResponseSchema, 200, {
        "Set-Cookie": `mock_refresh=${result.session.user.id}; Path=/; SameSite=Lax`,
      });
    }),
  ),
  http.post(
    "*/api/auth/refresh",
    mockHandler(async ({ request, cookies }) => {
      emptySchema.parse(await request.json());
      const result = authDb.refresh(cookies.mock_refresh);
      return mockJson(request, result, loginResponseSchema, 200, {
        "Set-Cookie": `mock_refresh=${result.session.user.id}; Path=/; SameSite=Lax`,
      });
    }),
  ),
  http.get(
    "*/api/auth/me",
    mockHandler(({ request }) =>
      mockJson(request, authDb.getSession(accessToken(request)), sessionSchema),
    ),
  ),
  http.patch(
    "*/api/auth/me",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const form = await request.formData();
      const payload = updateProfileSchema.parse(Object.fromEntries(form));
      return mockCommand(
        request,
        {
          operation: "updateProfile",
          feature: "auth",
          viewer,
          permission: null,
          params: {},
          payload,
        },
        async () =>
          mockJson(
            request,
            await authDb.updateProfile(
              viewer,
              payload,
              request.headers.get("If-Match"),
            ),
            sessionSchema,
          ),
      );
    }),
  ),
  http.get(
    "*/api/avatars/:avatarId",
    mockHandler(({ params }) => {
      const file = authDb.getAvatar(idSchema.parse(params.avatarId));
      return new HttpResponse(file, {
        headers: {
          "Content-Type": file.type,
          "Content-Length": String(file.size),
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }),
  ),
  http.post(
    "*/api/auth/logout",
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
