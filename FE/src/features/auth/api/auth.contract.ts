// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  AuthLoginResponseSchema,
  AuthSessionSchema,
} from "../schemas/auth.schema";

export const loginContract = endpoint({
  ...{
    name: "login",
    feature: "auth",
    method: "POST",
    path: "/api/v1/auth/login",
    version: false,
    idempotency: false,
    invalidates: ["all-session-cache"],
    permission: null,
    fields: [
      {
        name: "username",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 64; Tên đăng nhập nội bộ; trim đầu/cuối, giữ quy ước hoa/thường đã chốt.",
      },
      {
        name: "password",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 128; Giữ nguyên chuỗi đăng nhập; không trim/log/persist.",
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
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(64),
      password: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(128),
    })
    .strict(),
  response: AuthLoginResponseSchema,
});

export const logoutContract = endpoint({
  ...{
    name: "logout",
    feature: "auth",
    method: "POST",
    path: "/api/v1/auth/logout",
    version: false,
    idempotency: false,
    invalidates: ["all-session-cache"],
    permission: null,
    fields: [],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: z.object({
    ok: z.literal(true),
  }),
});

export const refreshSessionContract = endpoint({
  ...{
    name: "refreshSession",
    feature: "auth",
    method: "POST",
    path: "/api/v1/auth/refresh",
    version: false,
    idempotency: false,
    invalidates: ["auth"],
    permission: null,
    fields: [],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: AuthLoginResponseSchema,
});

export const getSessionContract = endpoint({
  ...{
    name: "getSession",
    feature: "auth",
    method: "GET",
    path: "/api/v1/auth/me",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: AuthSessionSchema,
});
