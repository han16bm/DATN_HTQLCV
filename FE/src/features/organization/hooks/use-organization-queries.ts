"use client";
import { teamQuerySchema } from "@/features/organization/schemas/team.schema";
import { unitQuerySchema } from "@/features/organization/schemas/unit.schema";
import {
  type TeamQuery,
  type UnitQuery,
} from "@/features/organization/types/organization.types";
import { useSession } from "@/lib/auth/session-context";
import type { QueryOptions } from "@/lib/query/use-query-access";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { queryIdSchema } from "@/lib/validation/request.schema";
import { useQuery } from "@tanstack/react-query";
import { organizationKeys } from "../api/organization.keys";
import { organizationService } from "../api/organization.service";

export function useListUnitsQuery(
  query: UnitQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = unitQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? organizationKeys.listUnits(session?.user.id ?? "anonymous", filters)
      : [
          "organization",
          session?.user.id ?? "anonymous",
          "listUnits",
          "invalid-query",
        ],
    queryFn: ({ signal }) => organizationService.listUnits(filters, { signal }),
    enabled: options.enabled !== false && Boolean(session) && parsed.success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "organization");
}
export function useGetUnitQuery(unitId: string, options: QueryOptions = {}) {
  const id = queryIdSchema.parse(unitId);
  const { session } = useSession();
  const result = useQuery({
    queryKey: organizationKeys.getUnit(session?.user.id ?? "anonymous", id),
    queryFn: ({ signal }) => organizationService.getUnit(id, { signal }),
    enabled: options.enabled !== false && Boolean(session) && Boolean(id),
    staleTime: 10000,
  });
  return useQueryAccess(result, "organization");
}
export function useListTeamsQuery(
  query: TeamQuery = {},
  options: QueryOptions = {},
) {
  const { session } = useSession();
  const parsed = teamQuerySchema.safeParse(query);
  const filters = parsed.success ? parsed.data : query;
  const result = useQuery({
    queryKey: parsed.success
      ? organizationKeys.listTeams(session?.user.id ?? "anonymous", filters)
      : [
          "organization",
          session?.user.id ?? "anonymous",
          "listTeams",
          "invalid-query",
        ],
    queryFn: ({ signal }) => organizationService.listTeams(filters, { signal }),
    enabled: options.enabled !== false && Boolean(session) && parsed.success,
    staleTime: 30000,
  });
  return useQueryAccess(result, "organization");
}
export function useGetTeamQuery(teamId: string, options: QueryOptions = {}) {
  const id = queryIdSchema.parse(teamId);
  const { session } = useSession();
  const result = useQuery({
    queryKey: organizationKeys.getTeam(session?.user.id ?? "anonymous", id),
    queryFn: ({ signal }) => organizationService.getTeam(id, { signal }),
    enabled: options.enabled !== false && Boolean(session) && Boolean(id),
    staleTime: 10000,
  });
  return useQueryAccess(result, "organization");
}
