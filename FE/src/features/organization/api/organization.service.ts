import type { OrganizationApi } from "@/features/organization/api/organization.contract";
import { teamSchema } from "@/features/organization/schemas/team.schema";
import { unitSchema } from "@/features/organization/schemas/unit.schema";
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
import { apiClient } from "@/services/api-client";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api.types";
export const organizationService: OrganizationApi = {
  listUnits(query: UnitQuery = {}, options: RequestOptions = {}) {
    return apiClient.get(`/units`, page(unitSchema), {
      ...options,
      query,
    });
  },
  getUnit(unitId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/units/${encodeURIComponent(unitId)}`,
      unitSchema,
      options,
    );
  },
  createUnit(payload: CreateUnitInput, options: MutationOptions) {
    return apiClient.post(`/units`, payload, unitSchema, options);
  },
  updateUnit(
    unitId: string,
    payload: UpdateUnitInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/units/${encodeURIComponent(unitId)}`,
      payload,
      unitSchema,
      options,
    );
  },
  deactivateUnit(
    unitId: string,
    payload: DeactivateUnitInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/units/${encodeURIComponent(unitId)}/deactivate`,
      payload,
      unitSchema,
      options,
    );
  },
  listTeams(query: TeamQuery = {}, options: RequestOptions = {}) {
    return apiClient.get(`/teams`, page(teamSchema), {
      ...options,
      query,
    });
  },
  getTeam(teamId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/teams/${encodeURIComponent(teamId)}`,
      teamSchema,
      options,
    );
  },
  createTeam(payload: CreateTeamInput, options: MutationOptions) {
    return apiClient.post(`/teams`, payload, teamSchema, options);
  },
  updateTeam(
    teamId: string,
    payload: UpdateTeamInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/teams/${encodeURIComponent(teamId)}`,
      payload,
      teamSchema,
      options,
    );
  },
  replaceTeamMembers(
    teamId: string,
    payload: ReplaceTeamMembersInput,
    options: VersionOptions,
  ) {
    return apiClient.put(
      `/teams/${encodeURIComponent(teamId)}/members`,
      payload,
      teamSchema,
      options,
    );
  },
  deactivateTeam(
    teamId: string,
    payload: DeactivateTeamInput,
    options: VersionOptions,
  ) {
    return apiClient.post(
      `/teams/${encodeURIComponent(teamId)}/deactivate`,
      payload,
      teamSchema,
      options,
    );
  },
};
