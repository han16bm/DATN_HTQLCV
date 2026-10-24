import {
  type TeamQuery,
  type UnitQuery,
} from "@/features/organization/types/organization.types";
export const organizationKeys = {
  all: ["organization"] as const,
  viewer: (viewerId: string) => ["organization", viewerId] as const,
  listUnits: (viewerId: string, query: UnitQuery) =>
    ["organization", viewerId, "listUnits", query] as const,
  getUnit: (viewerId: string, unitId: string) =>
    ["organization", viewerId, "getUnit", unitId] as const,
  listTeams: (viewerId: string, query: TeamQuery) =>
    ["organization", viewerId, "listTeams", query] as const,
  getTeam: (viewerId: string, teamId: string) =>
    ["organization", viewerId, "getTeam", teamId] as const,
};
