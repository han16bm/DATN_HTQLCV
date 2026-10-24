// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  UsersSystemRoleSchema,
  UsersUserStatusSchema,
  UsersUserSchema,
} from "../schemas/users.schema";

import { page } from "@/types/common";
export const listUsersContract = endpoint({
  ...{
    name: "listUsers",
    feature: "users",
    method: "GET",
    path: "/api/v1/users",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "USERS_MANAGE",
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
    .object({
      page: z.number().int().safe().min(1).optional().default(1),
      pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
      q: z.string().trim().max(255).optional(),
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      systemRole: UsersSystemRoleSchema.optional(),
      status: UsersUserStatusSchema.optional(),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(UsersUserSchema),
});

export const getUserContract = endpoint({
  ...{
    name: "getUser",
    feature: "users",
    method: "GET",
    path: "/api/v1/users/:userId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: "USERS_MANAGE",
    fields: [],
  },
  params: z
    .object({
      userId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: UsersUserSchema,
});

export const createUserContract = endpoint({
  ...{
    name: "createUser",
    feature: "users",
    method: "POST",
    path: "/api/v1/users",
    version: false,
    idempotency: true,
    invalidates: ["users"],
    permission: "USERS_MANAGE",
    fields: [
      {
        name: "username",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 3; độ dài ≤ 64; mẫu: ^[a-zA-Z0-9._-]+$; Tên đăng nhập nội bộ; trim đầu/cuối, giữ quy ước hoa/thường đã chốt.",
      },
      {
        name: "displayName",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Họ tên hiển thị.",
      },
      {
        name: "email",
        type: "string",
        required: true,
        rules: "Email; request trim rồi lowercase.",
      },
      {
        name: "unitId",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép.",
      },
      {
        name: "systemRole",
        type: "Users.SystemRoleDTO",
        required: true,
        rules: "Vai trò hệ thống, không tự cấp quyền mọi dự án.",
      },
      {
        name: "initialPassword",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 8; độ dài ≤ 128; Mật khẩu tạm khi cấp tài khoản; không trả về UserDTO.",
      },
    ],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      username: z
        .string()
        .trim()
        .min(3, "Vui lòng nhập thông tin bắt buộc")
        .max(64)
        .regex(/^[a-zA-Z0-9._-]+$/),
      displayName: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255),
      email: z.string().trim().toLowerCase().email(),
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      systemRole: UsersSystemRoleSchema,
      initialPassword: z
        .string()
        .min(8, "Vui lòng nhập thông tin bắt buộc")
        .max(128),
    })
    .strict(),
  response: UsersUserSchema,
});

export const updateUserContract = endpoint({
  ...{
    name: "updateUser",
    feature: "users",
    method: "PATCH",
    path: "/api/v1/users/:userId",
    version: true,
    idempotency: true,
    invalidates: ["users", "auth", "project-members"],
    permission: "USERS_MANAGE",
    fields: [
      {
        name: "displayName",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Họ tên hiển thị.",
      },
      {
        name: "email",
        type: "string",
        required: false,
        rules: "Email; request trim rồi lowercase.",
      },
      {
        name: "unitId",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép.",
      },
      {
        name: "systemRole",
        type: "Users.SystemRoleDTO",
        required: false,
        rules: "Vai trò hệ thống, không tự cấp quyền mọi dự án.",
      },
      {
        name: "reason",
        type: "string",
        required: false,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity.",
      },
    ],
  },
  params: z
    .object({
      userId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      displayName: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255)
        .optional(),
      email: z.string().trim().toLowerCase().email().optional(),
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      systemRole: UsersSystemRoleSchema.optional(),
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000)
        .optional(),
    })
    .strict(),
  response: UsersUserSchema,
});

export const lockUserContract = endpoint({
  ...{
    name: "lockUser",
    feature: "users",
    method: "POST",
    path: "/api/v1/users/:userId/lock",
    version: true,
    idempotency: true,
    invalidates: ["users", "auth", "tasks", "project-members"],
    permission: "USERS_MANAGE",
    fields: [
      {
        name: "reason",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity.",
      },
      {
        name: "mode",
        type: "enum(NORMAL, EMERGENCY)",
        required: true,
        rules: "NORMAL cần bàn giao; EMERGENCY thu hồi truy cập ngay.",
      },
    ],
  },
  params: z
    .object({
      userId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
      mode: z.enum(["NORMAL", "EMERGENCY"]),
    })
    .strict(),
  response: UsersUserSchema,
});

export const unlockUserContract = endpoint({
  ...{
    name: "unlockUser",
    feature: "users",
    method: "POST",
    path: "/api/v1/users/:userId/unlock",
    version: true,
    idempotency: true,
    invalidates: ["users", "auth"],
    permission: "USERS_MANAGE",
    fields: [
      {
        name: "reason",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity.",
      },
    ],
  },
  params: z
    .object({
      userId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: UsersUserSchema,
});

export const resetUserPasswordContract = endpoint({
  ...{
    name: "resetUserPassword",
    feature: "users",
    method: "POST",
    path: "/api/v1/users/:userId/reset-password",
    version: true,
    idempotency: true,
    invalidates: ["users", "auth"],
    permission: "USERS_MANAGE",
    fields: [
      {
        name: "temporaryPassword",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 8; độ dài ≤ 128; Mật khẩu tạm do người có quyền cấp lại; không lưu trong cache giao diện.",
      },
      {
        name: "reason",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 2000; Lý do của thao tác; ghi audit, không mass assign vào entity.",
      },
    ],
  },
  params: z
    .object({
      userId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      temporaryPassword: z
        .string()
        .min(8, "Vui lòng nhập thông tin bắt buộc")
        .max(128),
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: z.object({
    ok: z.literal(true),
  }),
});
