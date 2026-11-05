"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { organizationKeys } from "../api/organization.keys";
import { organizationService } from "../api/organization.service";
import { teamQuerySchema } from "../schemas/team.schema";
import { unitQuerySchema } from "../schemas/unit.schema";
import { type TeamQuery, type UnitQuery } from "../types/organization.types";

export function useListUnitsQuery(query: UnitQuery = {}) {
  const viewerId = useSession().session?.user.id;

  const filters = unitQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: organizationKeys.listUnits(viewerId, filters),
    queryFn: ({ signal }) => organizationService.listUnits(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "organization");
}

export function useGetUnitQuery(unitId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: organizationKeys.getUnit(viewerId, unitId),
    queryFn: ({ signal }) => organizationService.getUnit(unitId, { signal }),
    enabled: Boolean(viewerId && unitId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "organization");
}

export function useListTeamsQuery(query: TeamQuery = {}) {
  const viewerId = useSession().session?.user.id;

  const filters = teamQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: organizationKeys.listTeams(viewerId, filters),
    queryFn: ({ signal }) => organizationService.listTeams(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 30000,
  });
  return useQueryAccess(result, "organization");
}

export function useGetTeamQuery(teamId: string) {
  const viewerId = useSession().session?.user.id;
  const result = useQuery({
    queryKey: organizationKeys.getTeam(viewerId, teamId),
    queryFn: ({ signal }) => organizationService.getTeam(teamId, { signal }),
    enabled: Boolean(viewerId && teamId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "organization");
}
