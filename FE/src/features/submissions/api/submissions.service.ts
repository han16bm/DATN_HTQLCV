// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./submissions.contract";
export const submissionsService = {
  listSubmissions: (
    request: ContractRequest<typeof contracts.listSubmissionsContract>,
  ) => apiClient.request(contracts.listSubmissionsContract, request),
  getSubmission: (
    request: ContractRequest<typeof contracts.getSubmissionContract>,
  ) => apiClient.request(contracts.getSubmissionContract, request),
  createSubmission: (
    request: ContractRequest<typeof contracts.createSubmissionContract>,
  ) => apiClient.request(contracts.createSubmissionContract, request),
  approveSubmission: (
    request: ContractRequest<typeof contracts.approveSubmissionContract>,
  ) => apiClient.request(contracts.approveSubmissionContract, request),
  requestSubmissionRevision: (
    request: ContractRequest<
      typeof contracts.requestSubmissionRevisionContract
    >,
  ) => apiClient.request(contracts.requestSubmissionRevisionContract, request),
  listReviewQueue: (
    request: ContractRequest<typeof contracts.listReviewQueueContract>,
  ) => apiClient.request(contracts.listReviewQueueContract, request),
};
