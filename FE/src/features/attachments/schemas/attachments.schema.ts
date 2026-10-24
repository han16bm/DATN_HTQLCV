// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { z } from "zod";

export const AttachmentsAttachmentSchema = z.object({
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
export type AttachmentsAttachmentDTO = z.output<
  typeof AttachmentsAttachmentSchema
>;

export const AttachmentsUploadPolicySchema = z.object({
  maxBytes: z.number().int().safe().positive(),
  maxAttachments: z.number().int().safe().positive(),
  allowedMimeTypes: z.array(z.string()),
});
export type AttachmentsUploadPolicyDTO = z.output<
  typeof AttachmentsUploadPolicySchema
>;
