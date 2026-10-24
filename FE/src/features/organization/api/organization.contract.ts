// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { endpoint } from "@/services/api-contract";
import {
  OrganizationUnitSchema,
  OrganizationTeamSchema,
} from "../schemas/organization.schema";

import { page } from "@/types/common";
export const listUnitsContract = endpoint({
  ...{
    name: "listUnits",
    feature: "organization",
    method: "GET",
    path: "/api/v1/units",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z.object({}).strict(),
  query: z
    .object({
      page: z.number().int().safe().min(1).optional().default(1),
      pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
      q: z.string().trim().max(255).optional(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(OrganizationUnitSchema),
});

export const getUnitContract = endpoint({
  ...{
    name: "getUnit",
    feature: "organization",
    method: "GET",
    path: "/api/v1/units/:unitId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: OrganizationUnitSchema,
});

export const createUnitContract = endpoint({
  ...{
    name: "createUnit",
    feature: "organization",
    method: "POST",
    path: "/api/v1/units",
    version: false,
    idempotency: true,
    invalidates: ["organization"],
    permission: "ORGANIZATION_MANAGE",
    fields: [
      {
        name: "name",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim.",
      },
      {
        name: "parentId",
        type: "string / null",
        required: true,
        rules: "Đơn vị cấp trên; null là không có.",
      },
      {
        name: "managerId",
        type: "string / null",
        required: true,
        rules: "Người quản lý đơn vị; null là chưa chỉ định.",
      },
    ],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255),
      parentId: z.string().trim().nullable(),
      managerId: z.string().trim().nullable(),
    })
    .strict(),
  response: OrganizationUnitSchema,
});

export const updateUnitContract = endpoint({
  ...{
    name: "updateUnit",
    feature: "organization",
    method: "PATCH",
    path: "/api/v1/units/:unitId",
    version: true,
    idempotency: true,
    invalidates: ["organization"],
    permission: "ORGANIZATION_MANAGE",
    fields: [
      {
        name: "name",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim.",
      },
      {
        name: "parentId",
        type: "string / null",
        required: false,
        rules: "Đơn vị cấp trên; null là không có.",
      },
      {
        name: "managerId",
        type: "string / null",
        required: false,
        rules: "Người quản lý đơn vị; null là chưa chỉ định.",
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
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255)
        .optional(),
      parentId: z.string().trim().nullable().optional(),
      managerId: z.string().trim().nullable().optional(),
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: OrganizationUnitSchema,
});

export const deactivateUnitContract = endpoint({
  ...{
    name: "deactivateUnit",
    feature: "organization",
    method: "POST",
    path: "/api/v1/units/:unitId/deactivate",
    version: true,
    idempotency: true,
    invalidates: ["organization"],
    permission: "ORGANIZATION_MANAGE",
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
      unitId: z
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
  response: OrganizationUnitSchema,
});

export const listTeamsContract = endpoint({
  ...{
    name: "listTeams",
    feature: "organization",
    method: "GET",
    path: "/api/v1/teams",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
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
    })
    .strict(),
  body: z.object({}).strict(),
  response: page(OrganizationTeamSchema),
});

export const getTeamContract = endpoint({
  ...{
    name: "getTeam",
    feature: "organization",
    method: "GET",
    path: "/api/v1/teams/:teamId",
    version: false,
    idempotency: false,
    invalidates: [],
    permission: null,
    fields: [],
  },
  params: z
    .object({
      teamId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
  response: OrganizationTeamSchema,
});

export const createTeamContract = endpoint({
  ...{
    name: "createTeam",
    feature: "organization",
    method: "POST",
    path: "/api/v1/teams",
    version: false,
    idempotency: true,
    invalidates: ["organization"],
    permission: "ORGANIZATION_MANAGE",
    fields: [
      {
        name: "name",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim.",
      },
      {
        name: "unitId",
        type: "string",
        required: true,
        rules: "độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép.",
      },
      {
        name: "memberIds",
        type: "array<string>",
        required: true,
        rules: "Danh sách ID tài khoản thuộc nhóm; không tạo quyền dự án.",
      },
    ],
  },
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255),
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
      memberIds: z.array(z.string().trim()),
    })
    .strict(),
  response: OrganizationTeamSchema,
});

export const updateTeamContract = endpoint({
  ...{
    name: "updateTeam",
    feature: "organization",
    method: "PATCH",
    path: "/api/v1/teams/:teamId",
    version: true,
    idempotency: true,
    invalidates: ["organization"],
    permission: "ORGANIZATION_MANAGE",
    fields: [
      {
        name: "name",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 255; Tên hiển thị sau trim.",
      },
      {
        name: "unitId",
        type: "string",
        required: false,
        rules: "độ dài ≥ 1; độ dài ≤ 100; ID đơn vị trong phạm vi được phép.",
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
      teamId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(255)
        .optional(),
      unitId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100)
        .optional(),
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: OrganizationTeamSchema,
});

export const replaceTeamMembersContract = endpoint({
  ...{
    name: "replaceTeamMembers",
    feature: "organization",
    method: "PUT",
    path: "/api/v1/teams/:teamId/members",
    version: true,
    idempotency: true,
    invalidates: ["organization"],
    permission: "ORGANIZATION_MANAGE",
    fields: [
      {
        name: "memberIds",
        type: "array<string>",
        required: true,
        rules: "Danh sách ID tài khoản thuộc nhóm; không tạo quyền dự án.",
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
      teamId: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(100),
    })
    .strict(),
  query: z.object({}).strict(),
  body: z
    .object({
      memberIds: z.array(z.string().trim()),
      reason: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập thông tin bắt buộc")
        .max(2000),
    })
    .strict(),
  response: OrganizationTeamSchema,
});

export const deactivateTeamContract = endpoint({
  ...{
    name: "deactivateTeam",
    feature: "organization",
    method: "POST",
    path: "/api/v1/teams/:teamId/deactivate",
    version: true,
    idempotency: true,
    invalidates: ["organization"],
    permission: "ORGANIZATION_MANAGE",
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
      teamId: z
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
  response: OrganizationTeamSchema,
});
