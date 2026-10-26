import {
  createUserSchema,
  resetPasswordSchema,
  resetUserPasswordResultSchema,
  updateUserSchema,
  userLockSchema,
} from "@/features/users/schemas/user-form.schema";
import {
  userQuerySchema,
  userRowSchema,
  userSchema,
} from "@/features/users/schemas/user.schema";
import { page, reasonSchema } from "@/lib/validation/common.schema";
import { emptySchema, idSchema } from "@/lib/validation/request.schema";
import { http } from "msw";
import { usersDb } from "../db";
import { profileSchema } from "@/features/users/schemas/profile.schema";
import {
  authenticatedUser,
  mockCommand,
  mockHandler,
  mockJson,
  parseQuery,
} from "./http";
export const userHandlers = [
  http.get(
    "*/api/users/:userId/profile",
    mockHandler(({ request, params }) => {
      authenticatedUser(request);
      const userId = idSchema.parse(params.userId);
      parseQuery(request, emptySchema);
      return mockJson(request, usersDb.getProfile(userId), profileSchema);
    }),
  ),
  http.get(
    "*/api/users",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const query = parseQuery(request, userQuerySchema);
      return mockJson(
        request,
        usersDb.listUsers(viewer, query),
        page(userRowSchema),
        200,
      );
    }),
  ),
  http.get(
    "*/api/users/:userId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const userId = idSchema.parse(params.userId);
      return mockJson(
        request,
        usersDb.getUser(viewer, userId),
        userSchema,
        200,
      );
    }),
  ),
  http.post(
    "*/api/users",
    mockHandler(async ({ request }) => {
      const viewer = authenticatedUser(request);
      const payload = createUserSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "createUser",
          feature: "users",
          viewer,
          action: "USERS_MANAGE",
          params: {},
          payload,
        },
        async () => {
          return mockJson(
            request,
            usersDb.createUser(viewer, payload),
            userSchema,
            201,
          );
        },
      );
    }),
  ),
  http.patch(
    "*/api/users/:userId",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const userId = idSchema.parse(params.userId);
      const payload = updateUserSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "updateUser",
          feature: "users",
          viewer,
          action: "USERS_MANAGE",
          params: { userId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            usersDb.updateUser(
              viewer,
              userId,
              payload,
              request.headers.get("If-Match"),
            ),
            userSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/users/:userId/lock",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const userId = idSchema.parse(params.userId);
      const payload = userLockSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "lockUser",
          feature: "users",
          viewer,
          action: "USERS_MANAGE",
          params: { userId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            usersDb.lockUser(
              viewer,
              userId,
              payload,
              request.headers.get("If-Match"),
            ),
            userSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/users/:userId/unlock",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const userId = idSchema.parse(params.userId);
      const payload = reasonSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "unlockUser",
          feature: "users",
          viewer,
          action: "USERS_MANAGE",
          params: { userId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            usersDb.unlockUser(
              viewer,
              userId,
              payload,
              request.headers.get("If-Match"),
            ),
            userSchema,
            200,
          );
        },
      );
    }),
  ),
  http.post(
    "*/api/users/:userId/reset-password",
    mockHandler(async ({ request, params }) => {
      const viewer = authenticatedUser(request);
      const userId = idSchema.parse(params.userId);
      const payload = resetPasswordSchema.parse(await request.json());
      return mockCommand(
        request,
        {
          operation: "resetUserPassword",
          feature: "users",
          viewer,
          action: "USERS_MANAGE",
          params: { userId },
          payload,
        },
        async () => {
          return mockJson(
            request,
            usersDb.resetUserPassword(
              viewer,
              userId,
              payload,
              request.headers.get("If-Match"),
            ),
            resetUserPasswordResultSchema,
            200,
          );
        },
      );
    }),
  ),
];
