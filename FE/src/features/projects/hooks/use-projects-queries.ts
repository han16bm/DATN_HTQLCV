// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/projects.contract";
import { projectsService } from "../api/projects.service";
import { projectsKeys } from "../api/projects.keys";
export function useListProjectsQuery(
  request: ContractRequest<typeof contracts.listProjectsContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listProjectsContract,
    request,
    projectsService.listProjects,
    projectsKeys.listProjects,
    options,
  );
}
export function useGetProjectQuery(
  request: ContractRequest<typeof contracts.getProjectContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getProjectContract,
    request,
    projectsService.getProject,
    projectsKeys.getProject,
    options,
  );
}
export function useGetProjectClosureChecksQuery(
  request: ContractRequest<typeof contracts.getProjectClosureChecksContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getProjectClosureChecksContract,
    request,
    projectsService.getProjectClosureChecks,
    projectsKeys.getProjectClosureChecks,
    options,
  );
}
export function useListProjectHistoryQuery(
  request: ContractRequest<typeof contracts.listProjectHistoryContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listProjectHistoryContract,
    request,
    projectsService.listProjectHistory,
    projectsKeys.listProjectHistory,
    options,
  );
}
