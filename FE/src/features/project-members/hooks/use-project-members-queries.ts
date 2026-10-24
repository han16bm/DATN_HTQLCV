// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/project-members.contract";
import { projectMembersService } from "../api/project-members.service";
import { projectMembersKeys } from "../api/project-members.keys";
export function useListProjectMembersQuery(
  request: ContractRequest<typeof contracts.listProjectMembersContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listProjectMembersContract,
    request,
    projectMembersService.listProjectMembers,
    projectMembersKeys.listProjectMembers,
    options,
  );
}
