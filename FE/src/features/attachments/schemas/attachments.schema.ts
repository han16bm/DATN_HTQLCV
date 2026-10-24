import { idSchema } from "@/lib/validation/request.schema";
import { z } from "zod";
export const attachmentSchema = z.object({
  id: idSchema,
  filename: z.string().min(1, "Vui lòng nhập thông tin bắt buộc"),
  sizeBytes: z.number().int().safe().positive(),
  status: z.enum(["READY", "REJECTED"]),
});
export const uploadPolicySchema = z.object({
  maxBytes: z.number().int().safe().positive(),
  maxAttachments: z.number().int().safe().positive(),
  allowedMimeTypes: z.array(z.string()),
});
export const uploadSchema = z
  .object({ taskId: idSchema, file: z.instanceof(Blob) })
  .strict();
