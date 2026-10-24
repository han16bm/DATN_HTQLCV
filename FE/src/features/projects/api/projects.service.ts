// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./projects.contract";
export const projectsService = {
  listProjects: (
    request: ContractRequest<typeof contracts.listProjectsContract>,
  ) => apiClient.request(contracts.listProjectsContract, request),
  getProject: (request: ContractRequest<typeof contracts.getProjectContract>) =>
    apiClient.request(contracts.getProjectContract, request),
  createProject: (
    request: ContractRequest<typeof contracts.createProjectContract>,
  ) => apiClient.request(contracts.createProjectContract, request),
  updateProject: (
    request: ContractRequest<typeof contracts.updateProjectContract>,
  ) => apiClient.request(contracts.updateProjectContract, request),
  activateProject: (
    request: ContractRequest<typeof contracts.activateProjectContract>,
  ) => apiClient.request(contracts.activateProjectContract, request),
  getProjectClosureChecks: (
    request: ContractRequest<typeof contracts.getProjectClosureChecksContract>,
  ) => apiClient.request(contracts.getProjectClosureChecksContract, request),
  completeProject: (
    request: ContractRequest<typeof contracts.completeProjectContract>,
  ) => apiClient.request(contracts.completeProjectContract, request),
  cancelProject: (
    request: ContractRequest<typeof contracts.cancelProjectContract>,
  ) => apiClient.request(contracts.cancelProjectContract, request),
  listProjectHistory: (
    request: ContractRequest<typeof contracts.listProjectHistoryContract>,
  ) => apiClient.request(contracts.listProjectHistoryContract, request),
};
