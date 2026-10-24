// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/project-members.contract";
import { projectMembersService } from "../api/project-members.service";
export function useAddProjectMemberMutation() {
  return useFeatureMutation(
    contracts.addProjectMemberContract,
    projectMembersService.addProjectMember,
  );
}
export function useUpdateProjectMemberPermissionsMutation() {
  return useFeatureMutation(
    contracts.updateProjectMemberPermissionsContract,
    projectMembersService.updateProjectMemberPermissions,
  );
}
export function useEndProjectMembershipMutation() {
  return useFeatureMutation(
    contracts.endProjectMembershipContract,
    projectMembersService.endProjectMembership,
  );
}
