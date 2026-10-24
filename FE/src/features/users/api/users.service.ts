// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./users.contract";
export const usersService = {
  listUsers: (request: ContractRequest<typeof contracts.listUsersContract>) =>
    apiClient.request(contracts.listUsersContract, request),
  getUser: (request: ContractRequest<typeof contracts.getUserContract>) =>
    apiClient.request(contracts.getUserContract, request),
  createUser: (request: ContractRequest<typeof contracts.createUserContract>) =>
    apiClient.request(contracts.createUserContract, request),
  updateUser: (request: ContractRequest<typeof contracts.updateUserContract>) =>
    apiClient.request(contracts.updateUserContract, request),
  lockUser: (request: ContractRequest<typeof contracts.lockUserContract>) =>
    apiClient.request(contracts.lockUserContract, request),
  unlockUser: (request: ContractRequest<typeof contracts.unlockUserContract>) =>
    apiClient.request(contracts.unlockUserContract, request),
  resetUserPassword: (
    request: ContractRequest<typeof contracts.resetUserPasswordContract>,
  ) => apiClient.request(contracts.resetUserPasswordContract, request),
};
