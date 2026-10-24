import { personRefSchema } from "@/lib/validation/common.schema";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { z } from "zod";
export const addMemberSchema = z
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
  .strict();
export const memberPermissionsSchema = z
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
  .strict();
export const membershipSchema = z
  .object({
    id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    version: z.number().int().safe().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    projectId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    userId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
    projectRole: z.enum(["OWNER", "MANAGER", "MEMBER"]),
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
    joinedAt: z.iso.datetime(),
    endedAt: z.iso.datetime().nullable(),
    user: personRefSchema,
  })
  .superRefine(checkProjection);
export const projectMemberQuerySchema = z
  .object({
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
  })
  .strict();
