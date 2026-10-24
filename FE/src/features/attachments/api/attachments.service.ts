import type { AttachmentsApi } from "@/features/attachments/api/attachments.contract";
import {
  attachmentSchema,
  uploadPolicySchema,
} from "@/features/attachments/schemas/attachments.schema";
import { type UploadAttachmentInput } from "@/features/attachments/types/attachments.types";
import type { MutationOptions, RequestOptions } from "@/services/api-client";
import { apiClient, parseFile, parseResponse } from "@/services/api-client";
export const attachmentsService: AttachmentsApi = {
  getUploadPolicy(options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/attachments/policy", options)
      .then(parseResponse(uploadPolicySchema));
  },
  uploadAttachment(payload: UploadAttachmentInput, options: MutationOptions) {
    const form = new FormData();
    form.set("taskId", payload.taskId);
    form.set("file", payload.file);
    return apiClient
      .post<unknown>("/attachments", form, options)
      .then(parseResponse(attachmentSchema));
  },
  getAttachment(attachmentId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/attachments/${encodeURIComponent(attachmentId)}`, options)
      .then(parseResponse(attachmentSchema));
  },
  downloadAttachment(attachmentId: string, options: RequestOptions = {}) {
    return apiClient
      .get<Blob>(`/attachments/${encodeURIComponent(attachmentId)}/content`, {
        ...options,
        responseType: "blob",
      })
      .then(parseFile);
  },
};
