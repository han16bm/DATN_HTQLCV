import { page } from "@/lib/validation/common.schema";
import {
  type MutationOptions,
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { teamRowSchema, teamSchema } from "../schemas/team.schema";
import { unitRowSchema, unitSchema } from "../schemas/unit.schema";
import type {
  CreateTeamInput,
  CreateUnitInput,
  DeactivateTeamInput,
  DeactivateUnitInput,
  ReplaceTeamMembersInput,
  TeamDto,
  TeamList,
  TeamQuery,
  UnitDto,
  UnitList,
  UnitQuery,
  UpdateTeamInput,
  UpdateUnitInput,
} from "../types/organization.types";

export const organizationService = {
  async listUnits(query: UnitQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<UnitList>("/units", {
      ...options,
      params: query,
      schema: page(unitRowSchema),
    });
    return response.data;
  },

  async getUnit(unitId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<UnitDto>(
      `/units/${encodeURIComponent(unitId)}`,
      { ...options, schema: unitSchema },
    );
    return response.data;
  },

  async createUnit(payload: CreateUnitInput, options: MutationOptions) {
    const response = await apiClient.post<UnitDto>("/units", payload, {
      ...options,
      schema: unitSchema,
    });
    return response.data;
  },

  async updateUnit(
    unitId: string,
    payload: UpdateUnitInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<UnitDto>(
      `/units/${encodeURIComponent(unitId)}`,
      payload,
      { ...options, schema: unitSchema },
    );
    return response.data;
  },

  async deactivateUnit(
    unitId: string,
    payload: DeactivateUnitInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<UnitDto>(
      `/units/${encodeURIComponent(unitId)}/deactivate`,
      payload,
      { ...options, schema: unitSchema },
    );
    return response.data;
  },

  async listTeams(query: TeamQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<TeamList>("/teams", {
      ...options,
      params: query,
      schema: page(teamRowSchema),
    });
    return response.data;
  },

  async getTeam(teamId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<TeamDto>(
      `/teams/${encodeURIComponent(teamId)}`,
      { ...options, schema: teamSchema },
    );
    return response.data;
  },

  async createTeam(payload: CreateTeamInput, options: MutationOptions) {
    const response = await apiClient.post<TeamDto>("/teams", payload, {
      ...options,
      schema: teamSchema,
    });
    return response.data;
  },

  async updateTeam(
    teamId: string,
    payload: UpdateTeamInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<TeamDto>(
      `/teams/${encodeURIComponent(teamId)}`,
      payload,
      { ...options, schema: teamSchema },
    );
    return response.data;
  },

  async replaceTeamMembers(
    teamId: string,
    payload: ReplaceTeamMembersInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.put<TeamDto>(
      `/teams/${encodeURIComponent(teamId)}/members`,
      payload,
      { ...options, schema: teamSchema },
    );
    return response.data;
  },

  async deactivateTeam(
    teamId: string,
    payload: DeactivateTeamInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.post<TeamDto>(
      `/teams/${encodeURIComponent(teamId)}/deactivate`,
      payload,
      { ...options, schema: teamSchema },
    );
    return response.data;
  },
};
