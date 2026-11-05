import type { ViewerId } from "@/types/common";
import { type TeamQuery, type UnitQuery } from "../types/organization.types";
export const organizationKeys = {
  all: ["organization"] as const,
  viewer: (viewerId: ViewerId) =>
    ["organization", viewerId ?? "anonymous"] as const,
  listUnits: (viewerId: ViewerId, query: UnitQuery) =>
    [...organizationKeys.viewer(viewerId), "listUnits", query] as const,
  getUnit: (viewerId: ViewerId, unitId: string) =>
    [...organizationKeys.viewer(viewerId), "getUnit", unitId] as const,
  listTeams: (viewerId: ViewerId, query: TeamQuery) =>
    [...organizationKeys.viewer(viewerId), "listTeams", query] as const,
  getTeam: (viewerId: ViewerId, teamId: string) =>
    [...organizationKeys.viewer(viewerId), "getTeam", teamId] as const,
};
