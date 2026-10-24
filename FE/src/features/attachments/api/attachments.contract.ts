import {
  type AttachmentDto,
  type DownloadAttachmentResult,
  type UploadAttachmentInput,
  type UploadPolicy,
} from "@/features/attachments/types/attachments.types";
import type { MutationOptions, RequestOptions } from "@/services/api.types";
export interface AttachmentsApi {
  getUploadPolicy(options?: RequestOptions): Promise<UploadPolicy>;
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
  ): Promise<DownloadAttachmentResult>;
}
