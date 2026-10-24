// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./analytics.contract";
export const analyticsService = {
  getDashboard: (
    request: ContractRequest<typeof contracts.getDashboardContract>,
  ) => apiClient.request(contracts.getDashboardContract, request),
  getDeadlineRisks: (
    request: ContractRequest<typeof contracts.getDeadlineRisksContract>,
  ) => apiClient.request(contracts.getDeadlineRisksContract, request),
  getWorkload: (
    request: ContractRequest<typeof contracts.getWorkloadContract>,
  ) => apiClient.request(contracts.getWorkloadContract, request),
  getBottlenecks: (
    request: ContractRequest<typeof contracts.getBottlenecksContract>,
  ) => apiClient.request(contracts.getBottlenecksContract, request),
  getAnalysisSummary: (
    request: ContractRequest<typeof contracts.getAnalysisSummaryContract>,
  ) => apiClient.request(contracts.getAnalysisSummaryContract, request),
  createAnalysisJob: (
    request: ContractRequest<typeof contracts.createAnalysisJobContract>,
  ) => apiClient.request(contracts.createAnalysisJobContract, request),
  getAnalysisJob: (
    request: ContractRequest<typeof contracts.getAnalysisJobContract>,
  ) => apiClient.request(contracts.getAnalysisJobContract, request),
  getAnalysisDetail: (
    request: ContractRequest<typeof contracts.getAnalysisDetailContract>,
  ) => apiClient.request(contracts.getAnalysisDetailContract, request),
  createAnalysisFeedback: (
    request: ContractRequest<typeof contracts.createAnalysisFeedbackContract>,
  ) => apiClient.request(contracts.createAnalysisFeedbackContract, request),
  listAnalyticsFilterOptions: (
    request: ContractRequest<
      typeof contracts.listAnalyticsFilterOptionsContract
    >,
  ) => apiClient.request(contracts.listAnalyticsFilterOptionsContract, request),
};
