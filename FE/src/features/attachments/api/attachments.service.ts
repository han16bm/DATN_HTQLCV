import {
  type MutationOptions,
  type RequestOptions,
  apiClient,
} from "@/services/api-client";
import {
  attachmentSchema,
  uploadPolicySchema,
} from "../schemas/attachments.schema";
import type {
  AttachmentDto,
  UploadAttachmentInput,
  UploadPolicyDto,
} from "../types/attachments.types";

export const attachmentsService = {
  async getUploadPolicy(options: RequestOptions = {}) {
    const response = await apiClient.get<UploadPolicyDto>(
      "/attachments/policy",
      { ...options, schema: uploadPolicySchema },
    );
    return response.data;
  },

  async uploadAttachment(
    payload: UploadAttachmentInput,
    options: MutationOptions,
  ) {
    const form = new FormData();
    form.set("taskId", payload.taskId);
    form.set("file", payload.file);
    const response = await apiClient.post<AttachmentDto>("/attachments", form, {
      ...options,
      schema: attachmentSchema,
    });
    return response.data;
  },

  async getAttachment(attachmentId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<AttachmentDto>(
      `/attachments/${encodeURIComponent(attachmentId)}`,
      { ...options, schema: attachmentSchema },
    );
    return response.data;
  },

  async downloadAttachment(attachmentId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<Blob>(
      `/attachments/${encodeURIComponent(attachmentId)}/content`,
      {
        ...options,
        responseType: "blob",
      },
    );
    return response.data;
  },
};
