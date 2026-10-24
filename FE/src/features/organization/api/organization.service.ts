// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./organization.contract";
export const organizationService = {
  listUnits: (request: ContractRequest<typeof contracts.listUnitsContract>) =>
    apiClient.request(contracts.listUnitsContract, request),
  getUnit: (request: ContractRequest<typeof contracts.getUnitContract>) =>
    apiClient.request(contracts.getUnitContract, request),
  createUnit: (request: ContractRequest<typeof contracts.createUnitContract>) =>
    apiClient.request(contracts.createUnitContract, request),
  updateUnit: (request: ContractRequest<typeof contracts.updateUnitContract>) =>
    apiClient.request(contracts.updateUnitContract, request),
  deactivateUnit: (
    request: ContractRequest<typeof contracts.deactivateUnitContract>,
  ) => apiClient.request(contracts.deactivateUnitContract, request),
  listTeams: (request: ContractRequest<typeof contracts.listTeamsContract>) =>
    apiClient.request(contracts.listTeamsContract, request),
  getTeam: (request: ContractRequest<typeof contracts.getTeamContract>) =>
    apiClient.request(contracts.getTeamContract, request),
  createTeam: (request: ContractRequest<typeof contracts.createTeamContract>) =>
    apiClient.request(contracts.createTeamContract, request),
  updateTeam: (request: ContractRequest<typeof contracts.updateTeamContract>) =>
    apiClient.request(contracts.updateTeamContract, request),
  replaceTeamMembers: (
    request: ContractRequest<typeof contracts.replaceTeamMembersContract>,
  ) => apiClient.request(contracts.replaceTeamMembersContract, request),
  deactivateTeam: (
    request: ContractRequest<typeof contracts.deactivateTeamContract>,
  ) => apiClient.request(contracts.deactivateTeamContract, request),
};
