import type { OrganizationApi } from "@/features/organization/api/organization.contract";
import {
  teamRowSchema,
  teamSchema,
} from "@/features/organization/schemas/team.schema";
import {
  unitRowSchema,
  unitSchema,
} from "@/features/organization/schemas/unit.schema";
import {
  type CreateTeamInput,
  type CreateUnitInput,
  type DeactivateTeamInput,
  type DeactivateUnitInput,
  type ReplaceTeamMembersInput,
  type TeamQuery,
  type UnitQuery,
  type UpdateTeamInput,
  type UpdateUnitInput,
} from "@/features/organization/types/organization.types";
import { page } from "@/lib/validation/common.schema";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const organizationService: OrganizationApi = {
  listUnits(query: UnitQuery = {}, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/units", { ...options, params: query })
      .then(parseResponse(page(unitRowSchema)));
  },
  getUnit(unitId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/units/${encodeURIComponent(unitId)}`, options)
      .then(parseResponse(unitSchema));
  },
  createUnit(payload: CreateUnitInput, options: MutationOptions) {
    return apiClient
      .post<unknown>("/units", payload, options)
      .then(parseResponse(unitSchema));
  },
  updateUnit(
    unitId: string,
    payload: UpdateUnitInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(`/units/${encodeURIComponent(unitId)}`, payload, options)
      .then(parseResponse(unitSchema));
  },
  deactivateUnit(
    unitId: string,
    payload: DeactivateUnitInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/units/${encodeURIComponent(unitId)}/deactivate`,
        payload,
        options,
      )
      .then(parseResponse(unitSchema));
  },
  listTeams(query: TeamQuery = {}, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/teams", { ...options, params: query })
      .then(parseResponse(page(teamRowSchema)));
  },
  getTeam(teamId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/teams/${encodeURIComponent(teamId)}`, options)
      .then(parseResponse(teamSchema));
  },
  createTeam(payload: CreateTeamInput, options: MutationOptions) {
    return apiClient
      .post<unknown>("/teams", payload, options)
      .then(parseResponse(teamSchema));
  },
  updateTeam(
    teamId: string,
    payload: UpdateTeamInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(`/teams/${encodeURIComponent(teamId)}`, payload, options)
      .then(parseResponse(teamSchema));
  },
  replaceTeamMembers(
    teamId: string,
    payload: ReplaceTeamMembersInput,
    options: VersionOptions,
  ) {
    return apiClient
      .put<unknown>(
        `/teams/${encodeURIComponent(teamId)}/members`,
        payload,
        options,
      )
      .then(parseResponse(teamSchema));
  },
  deactivateTeam(
    teamId: string,
    payload: DeactivateTeamInput,
    options: VersionOptions,
  ) {
    return apiClient
      .post<unknown>(
        `/teams/${encodeURIComponent(teamId)}/deactivate`,
        payload,
        options,
      )
      .then(parseResponse(teamSchema));
  },
};
