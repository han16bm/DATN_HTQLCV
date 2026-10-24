// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/projects.contract";
import { projectsService } from "../api/projects.service";
export function useCreateProjectMutation() {
  return useFeatureMutation(
    contracts.createProjectContract,
    projectsService.createProject,
  );
}
export function useUpdateProjectMutation() {
  return useFeatureMutation(
    contracts.updateProjectContract,
    projectsService.updateProject,
  );
}
export function useActivateProjectMutation() {
  return useFeatureMutation(
    contracts.activateProjectContract,
    projectsService.activateProject,
  );
}
export function useCompleteProjectMutation() {
  return useFeatureMutation(
    contracts.completeProjectContract,
    projectsService.completeProject,
  );
}
export function useCancelProjectMutation() {
  return useFeatureMutation(
    contracts.cancelProjectContract,
    projectsService.cancelProject,
  );
}
