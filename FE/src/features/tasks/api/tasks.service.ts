// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./tasks.contract";
export const tasksService = {
  listTasks: (request: ContractRequest<typeof contracts.listTasksContract>) =>
    apiClient.request(contracts.listTasksContract, request),
  getTask: (request: ContractRequest<typeof contracts.getTaskContract>) =>
    apiClient.request(contracts.getTaskContract, request),
  createTask: (request: ContractRequest<typeof contracts.createTaskContract>) =>
    apiClient.request(contracts.createTaskContract, request),
  updateTask: (request: ContractRequest<typeof contracts.updateTaskContract>) =>
    apiClient.request(contracts.updateTaskContract, request),
  assignTask: (request: ContractRequest<typeof contracts.assignTaskContract>) =>
    apiClient.request(contracts.assignTaskContract, request),
  startTask: (request: ContractRequest<typeof contracts.startTaskContract>) =>
    apiClient.request(contracts.startTaskContract, request),
  pauseTask: (request: ContractRequest<typeof contracts.pauseTaskContract>) =>
    apiClient.request(contracts.pauseTaskContract, request),
  cancelTask: (request: ContractRequest<typeof contracts.cancelTaskContract>) =>
    apiClient.request(contracts.cancelTaskContract, request),
  updateRemainingEstimate: (
    request: ContractRequest<typeof contracts.updateRemainingEstimateContract>,
  ) => apiClient.request(contracts.updateRemainingEstimateContract, request),
  listTaskHistory: (
    request: ContractRequest<typeof contracts.listTaskHistoryContract>,
  ) => apiClient.request(contracts.listTaskHistoryContract, request),
};
