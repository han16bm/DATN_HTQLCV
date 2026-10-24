// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import { MembersMembershipSchema } from "../schemas/project-members.schema";

import { page } from "@/types/common";
export const listProjectMembersContract = endpoint({
  ...{
    name: "listProjectMembers",
    feature: "project-members",
    method: "GET",
    path: "/api/v1/projects/:projectId/members",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z
    .object({
      page: z.number().int().safe().min(1).optional().default(1),
      pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
      q: z.string().trim().max(255).optional(),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(MembersMembershipSchema),
});

export const addProjectMemberContract = endpoint({
  ...{
    name: "addProjectMember",
    feature: "project-members",
    method: "POST",
    path: "/api/v1/projects/:projectId/members",
    version: false,
    idempotency: true,
    invalidates: ["project-members", "auth"],
    permission: "MEMBERS_MANAGE",
    fields: [
      {
        name: "userId",
        type: "string",
        required: true,
        rules:
          "độ dài ≥ 1; độ dài ≤ 100; Tài khoản của thành viên/người ghi theo đúng model.",
      },
      {
        name: "projectRole",
        type: "enum(MANAGER, MEMBER)",
        required: true,
        rules:
          "Nhãn vai trò trên một dự án; quyền thực tế nằm trong permissions.",
      },
      {
        name: "permissions",
        type: "array<enum(USERS_MANAGE, ORGANIZATION_MANAGE, PROJECT_CREATE, PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE)>",
        required: true,
        rules:
          "Mảng enum quyền trong thẩm quyền; không gửi boolean từ form trực tiếp.",
      },
    ],
  },
  params: z
    .object({
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      userId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      projectRole: z.enum(["MANAGER", "MEMBER"]),
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
    })
    .strict(),
  response: MembersMembershipSchema,
});

export const updateProjectMemberPermissionsContract = endpoint({
  ...{
    name: "updateProjectMemberPermissions",
    feature: "project-members",
    method: "PATCH",
    path: "/api/v1/projects/:projectId/members/:membershipId",
    version: true,
    idempotency: true,
    invalidates: ["project-members", "auth"],
    permission: "MEMBERS_MANAGE",
    fields: [
      {
        name: "projectRole",
        type: "enum(MANAGER, MEMBER)",
        required: true,
        rules:
          "Nhãn vai trò trên một dự án; quyền thực tế nằm trong permissions.",
      },
      {
        name: "permissions",
        type: "array<enum(USERS_MANAGE, ORGANIZATION_MANAGE, PROJECT_CREATE, PROJECT_MANAGE, MEMBERS_MANAGE, TASKS_MANAGE, TASKS_REVIEW, ANALYTICS_VIEW, ALERTS_MANAGE)>",
        required: true,
        rules:
          "Mảng enum quyền trong thẩm quyền; không gửi boolean từ form trực tiếp.",
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
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      membershipId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      projectRole: z.enum(["MANAGER", "MEMBER"]),
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
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: MembersMembershipSchema,
});

export const endProjectMembershipContract = endpoint({
  ...{
    name: "endProjectMembership",
    feature: "project-members",
    method: "POST",
    path: "/api/v1/projects/:projectId/members/:membershipId/end",
    version: true,
    idempotency: true,
    invalidates: ["project-members", "auth", "tasks"],
    permission: "MEMBERS_MANAGE",
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
      projectId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      membershipId: z
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
  response: MembersMembershipSchema,
});
