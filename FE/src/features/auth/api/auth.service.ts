// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import { token } from "@/services/auth-session";
import * as contracts from "./auth.contract";
export const authService = {
  login: async (request: ContractRequest<typeof contracts.loginContract>) => {
    const result = await apiClient.request(contracts.loginContract, request);
    token.set(result.accessToken);
    return result.session; // Credential stays in the transport adapter, outside React Query cache.
  },
  logout: (request: ContractRequest<typeof contracts.logoutContract>) =>
    apiClient.request(contracts.logoutContract, request),
  refreshSession: async (
    request: ContractRequest<typeof contracts.refreshSessionContract>,
  ) => {
    const result = await apiClient.request(
      contracts.refreshSessionContract,
      request,
    );
    token.set(result.accessToken);
    return result.session; // Credential stays in the transport adapter, outside React Query cache.
  },
  getSession: (request: ContractRequest<typeof contracts.getSessionContract>) =>
    apiClient.request(contracts.getSessionContract, request),
};
