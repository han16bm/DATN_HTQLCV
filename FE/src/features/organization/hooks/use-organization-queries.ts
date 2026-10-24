// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/organization.contract";
import { organizationService } from "../api/organization.service";
import { organizationKeys } from "../api/organization.keys";
export function useListUnitsQuery(
  request: ContractRequest<typeof contracts.listUnitsContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listUnitsContract,
    request,
    organizationService.listUnits,
    organizationKeys.listUnits,
    options,
  );
}
export function useGetUnitQuery(
  request: ContractRequest<typeof contracts.getUnitContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getUnitContract,
    request,
    organizationService.getUnit,
    organizationKeys.getUnit,
    options,
  );
}
export function useListTeamsQuery(
  request: ContractRequest<typeof contracts.listTeamsContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listTeamsContract,
    request,
    organizationService.listTeams,
    organizationKeys.listTeams,
    options,
  );
}
export function useGetTeamQuery(
  request: ContractRequest<typeof contracts.getTeamContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getTeamContract,
    request,
    organizationService.getTeam,
    organizationKeys.getTeam,
    options,
  );
}
