import { z } from "zod";
export const attachmentSchema = z.object({
  id: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  version: z.number().int().safe().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  taskId: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  uploadedBy: z.string().min(1, "Vui lòng nhập thông tin bắt buộc").max(100),
  filename: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
  mimeType: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
  sizeBytes: z.number().int().safe().positive(),
  status: z.enum(["READY", "REJECTED"]),
});
export const uploadPolicySchema = z.object({
  maxBytes: z.number().int().safe().positive(),
  maxAttachments: z.number().int().safe().positive(),
  allowedMimeTypes: z.array(z.string()),
});
export const uploadSchema = z
  .object({ taskId: z.string().min(1), file: z.instanceof(Blob) })
  .strict();
