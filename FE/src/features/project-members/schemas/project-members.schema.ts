// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";
import { checkProjection } from "@/lib/validation/contract-refinements";
import { SharedPersonRefSchema } from "@/types/common";
export const MembersMemberCreateSchema = z
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
export type MembersMemberCreateDTO = z.output<typeof MembersMemberCreateSchema>;

export const MembersMemberPermissionsSchema = z
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
export type MembersMemberPermissionsDTO = z.output<
  typeof MembersMemberPermissionsSchema
>;

export const MembersMembershipSchema = z
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
    user: SharedPersonRefSchema,
  })
  .superRefine(checkProjection);
export type MembersMembershipDTO = z.output<typeof MembersMembershipSchema>;
