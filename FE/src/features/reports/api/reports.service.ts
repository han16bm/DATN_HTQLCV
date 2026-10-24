// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./reports.contract";
export const reportsService = {
  listReports: (
    request: ContractRequest<typeof contracts.listReportsContract>,
  ) => apiClient.request(contracts.listReportsContract, request),
  getReportPreview: (
    request: ContractRequest<typeof contracts.getReportPreviewContract>,
  ) => apiClient.request(contracts.getReportPreviewContract, request),
  getReport: (request: ContractRequest<typeof contracts.getReportContract>) =>
    apiClient.request(contracts.getReportContract, request),
  createReportDraft: (
    request: ContractRequest<typeof contracts.createReportDraftContract>,
  ) => apiClient.request(contracts.createReportDraftContract, request),
  updateReportDraft: (
    request: ContractRequest<typeof contracts.updateReportDraftContract>,
  ) => apiClient.request(contracts.updateReportDraftContract, request),
  refreshReportDraft: (
    request: ContractRequest<typeof contracts.refreshReportDraftContract>,
  ) => apiClient.request(contracts.refreshReportDraftContract, request),
  submitReport: (
    request: ContractRequest<typeof contracts.submitReportContract>,
  ) => apiClient.request(contracts.submitReportContract, request),
};
