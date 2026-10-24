import { z } from "zod";
export const createTeamSchema = z
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
export const teamMembersSchema = z
  .object({
    memberIds: z.array(z.string().trim()),
    reason: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập thông tin bắt buộc")
      .max(2000),
  })
  .strict();
export const updateTeamSchema = z
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
export const teamSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  version: z.number().int().safe().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  name: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(255),
  unitId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  memberIds: z.array(z.string()),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export const teamQuerySchema = z
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
  .strict();
