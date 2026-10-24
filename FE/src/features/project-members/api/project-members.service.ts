// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./project-members.contract";
export const projectMembersService = {
  listProjectMembers: (
    request: ContractRequest<typeof contracts.listProjectMembersContract>,
  ) => apiClient.request(contracts.listProjectMembersContract, request),
  addProjectMember: (
    request: ContractRequest<typeof contracts.addProjectMemberContract>,
  ) => apiClient.request(contracts.addProjectMemberContract, request),
  updateProjectMemberPermissions: (
    request: ContractRequest<
      typeof contracts.updateProjectMemberPermissionsContract
    >,
  ) =>
    apiClient.request(
      contracts.updateProjectMemberPermissionsContract,
      request,
    ),
  endProjectMembership: (
    request: ContractRequest<typeof contracts.endProjectMembershipContract>,
  ) => apiClient.request(contracts.endProjectMembershipContract, request),
};
