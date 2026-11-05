import { type z } from "zod";
import type {
  attachmentSchema,
  uploadPolicySchema,
  uploadSchema,
} from "../schemas/attachments.schema";
export type AttachmentDto = z.output<typeof attachmentSchema>;
export type UploadPolicyDto = z.output<typeof uploadPolicySchema>;
export type UploadAttachmentInput = z.input<typeof uploadSchema>;
