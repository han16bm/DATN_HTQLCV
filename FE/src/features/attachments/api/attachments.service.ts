import type { AttachmentsApi } from "@/features/attachments/api/attachments.contract";
import {
  attachmentSchema,
  uploadPolicySchema,
} from "@/features/attachments/schemas/attachments.schema";
import { type UploadAttachmentInput } from "@/features/attachments/types/attachments.types";
import { apiClient } from "@/services/api-client";
import type { MutationOptions, RequestOptions } from "@/services/api.types";
export const attachmentsService: AttachmentsApi = {
  getUploadPolicy(options: RequestOptions = {}) {
    return apiClient.get(`/attachments/policy`, uploadPolicySchema, options);
  },
  uploadAttachment(payload: UploadAttachmentInput, options: MutationOptions) {
    const form = new FormData();
    form.set("taskId", payload.taskId);
    form.set("file", payload.file);
    return apiClient.post(`/attachments`, form, attachmentSchema, options);
  },
  getAttachment(attachmentId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/attachments/${encodeURIComponent(attachmentId)}`,
      attachmentSchema,
      options,
    );
  },
  downloadAttachment(attachmentId: string, options: RequestOptions = {}) {
    return apiClient.download(
      `/attachments/${encodeURIComponent(attachmentId)}/content`,
      options,
    );
  },
};
