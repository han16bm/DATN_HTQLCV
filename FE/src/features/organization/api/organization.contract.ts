import {
  type CreateTeamInput,
  type CreateUnitInput,
  type DeactivateTeamInput,
  type DeactivateUnitInput,
  type ReplaceTeamMembersInput,
  type TeamDto,
  type TeamList,
  type TeamQuery,
  type UnitDto,
  type UnitList,
  type UnitQuery,
  type UpdateTeamInput,
  type UpdateUnitInput,
} from "@/features/organization/types/organization.types";
import type {
  MutationOptions,
  RequestOptions,
  VersionOptions,
} from "@/services/api-client";
export interface OrganizationApi {
  listUnits(query?: UnitQuery, options?: RequestOptions): Promise<UnitList>;
  getUnit(unitId: string, options?: RequestOptions): Promise<UnitDto>;
  createUnit(
    payload: CreateUnitInput,
    options: MutationOptions,
  ): Promise<UnitDto>;
  updateUnit(
    unitId: string,
    payload: UpdateUnitInput,
    options: VersionOptions,
  ): Promise<UnitDto>;
  deactivateUnit(
    unitId: string,
    payload: DeactivateUnitInput,
    options: VersionOptions,
  ): Promise<UnitDto>;
  listTeams(query?: TeamQuery, options?: RequestOptions): Promise<TeamList>;
  getTeam(teamId: string, options?: RequestOptions): Promise<TeamDto>;
  createTeam(
    payload: CreateTeamInput,
    options: MutationOptions,
  ): Promise<TeamDto>;
  updateTeam(
    teamId: string,
    payload: UpdateTeamInput,
    options: VersionOptions,
  ): Promise<TeamDto>;
  replaceTeamMembers(
    teamId: string,
    payload: ReplaceTeamMembersInput,
    options: VersionOptions,
  ): Promise<TeamDto>;
  deactivateTeam(
    teamId: string,
    payload: DeactivateTeamInput,
    options: VersionOptions,
  ): Promise<TeamDto>;
}
