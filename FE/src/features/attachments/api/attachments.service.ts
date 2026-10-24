// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./attachments.contract";
export const attachmentsService = {
  getUploadPolicy: (
    request: ContractRequest<typeof contracts.getUploadPolicyContract>,
  ) => apiClient.request(contracts.getUploadPolicyContract, request),
  uploadAttachment: (
    request: ContractRequest<typeof contracts.uploadAttachmentContract>,
  ) => apiClient.request(contracts.uploadAttachmentContract, request),
  getAttachment: (
    request: ContractRequest<typeof contracts.getAttachmentContract>,
  ) => apiClient.request(contracts.getAttachmentContract, request),
  downloadAttachment: (
    request: ContractRequest<typeof contracts.downloadAttachmentContract>,
  ) => apiClient.request(contracts.downloadAttachmentContract, request),
};
