// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/organization.contract";
import { organizationService } from "../api/organization.service";
export function useCreateUnitMutation() {
  return useFeatureMutation(
    contracts.createUnitContract,
    organizationService.createUnit,
  );
}
export function useUpdateUnitMutation() {
  return useFeatureMutation(
    contracts.updateUnitContract,
    organizationService.updateUnit,
  );
}
export function useDeactivateUnitMutation() {
  return useFeatureMutation(
    contracts.deactivateUnitContract,
    organizationService.deactivateUnit,
  );
}
export function useCreateTeamMutation() {
  return useFeatureMutation(
    contracts.createTeamContract,
    organizationService.createTeam,
  );
}
export function useUpdateTeamMutation() {
  return useFeatureMutation(
    contracts.updateTeamContract,
    organizationService.updateTeam,
  );
}
export function useReplaceTeamMembersMutation() {
  return useFeatureMutation(
    contracts.replaceTeamMembersContract,
    organizationService.replaceTeamMembers,
  );
}
export function useDeactivateTeamMutation() {
  return useFeatureMutation(
    contracts.deactivateTeamContract,
    organizationService.deactivateTeam,
  );
}
