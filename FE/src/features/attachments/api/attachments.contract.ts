import {
  type AttachmentDto,
  type UploadAttachmentInput,
  type UploadPolicyDto,
} from "@/features/attachments/types/attachments.types";
import type { MutationOptions, RequestOptions } from "@/services/api-client";
export interface AttachmentsApi {
  getUploadPolicy(options?: RequestOptions): Promise<UploadPolicyDto>;
  uploadAttachment(
    payload: UploadAttachmentInput,
    options: MutationOptions,
  ): Promise<AttachmentDto>;
  getAttachment(
    attachmentId: string,
    options?: RequestOptions,
  ): Promise<AttachmentDto>;
  downloadAttachment(
    attachmentId: string,
    options?: RequestOptions,
  ): Promise<Blob>;
}
