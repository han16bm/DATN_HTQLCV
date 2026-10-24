// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { normalizeQuery } from "@/lib/query/normalize-query";
import * as contracts from "./organization.contract";
export const organizationKeys = {
  all: ["organization"] as const,
  viewer: (viewerId: string) => ["organization", viewerId] as const,
  listUnits: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "organization",
      viewerId,
      "listUnits",
      params,
      normalizeQuery(contracts.listUnitsContract.query.parse(query)),
    ] as const,
  getUnit: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "organization",
      viewerId,
      "getUnit",
      params,
      normalizeQuery(contracts.getUnitContract.query.parse(query)),
    ] as const,
  listTeams: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "organization",
      viewerId,
      "listTeams",
      params,
      normalizeQuery(contracts.listTeamsContract.query.parse(query)),
    ] as const,
  getTeam: (
    viewerId: string,
    params: Record<string, string> = {},
    query: Record<string, unknown> = {},
  ) =>
    [
      "organization",
      viewerId,
      "getTeam",
      params,
      normalizeQuery(contracts.getTeamContract.query.parse(query)),
    ] as const,
};
