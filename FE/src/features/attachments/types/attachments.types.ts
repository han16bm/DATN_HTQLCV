import type {
  attachmentSchema,
  uploadPolicySchema,
  uploadSchema,
} from "@/features/attachments/schemas/attachments.schema";
import { type z } from "zod";
export type AttachmentDto = z.output<typeof attachmentSchema>;
export type UploadPolicyDto = z.output<typeof uploadPolicySchema>;
export type UploadAttachmentInput = z.input<typeof uploadSchema>;
