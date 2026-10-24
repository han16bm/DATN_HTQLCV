// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";

export const OrganizationTeamCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    unitId: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(100),
    memberIds: z.array(z.string().trim()),
  })
  .strict();
export type OrganizationTeamCreateDTO = z.output<
  typeof OrganizationTeamCreateSchema
>;

export const OrganizationTeamMembersSchema = z
  .object({
    memberIds: z.array(z.string().trim()),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export type OrganizationTeamMembersDTO = z.output<
  typeof OrganizationTeamMembersSchema
>;

export const OrganizationTeamPatchSchema = z
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
  .strict();
export type OrganizationTeamPatchDTO = z.output<
  typeof OrganizationTeamPatchSchema
>;

export const OrganizationTeamSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  version: z.number().int().safe().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  unitId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  memberIds: z.array(z.string()),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type OrganizationTeamDTO = z.output<typeof OrganizationTeamSchema>;

export const OrganizationUnitCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
    parentId: z.string().trim().nullable(),
    managerId: z.string().trim().nullable(),
  })
  .strict();
export type OrganizationUnitCreateDTO = z.output<
  typeof OrganizationUnitCreateSchema
>;

export const OrganizationUnitPatchSchema = z
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
  .strict();
export type OrganizationUnitPatchDTO = z.output<
  typeof OrganizationUnitPatchSchema
>;

export const OrganizationUnitQuerySchema = z
  .object({
    page: z.number().int().safe().min(1).optional().default(1),
    pageSize: z.number().int().safe().min(1).max(100).optional().default(20),
    q: z.string().trim().max(255).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .strict();
export type OrganizationUnitQueryDTO = z.output<
  typeof OrganizationUnitQuerySchema
>;

export const OrganizationUnitSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  version: z.number().int().safe().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  parentId: z.string().nullable(),
  managerId: z.string().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type OrganizationUnitDTO = z.output<typeof OrganizationUnitSchema>;
