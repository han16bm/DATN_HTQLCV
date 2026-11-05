"use client";

import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationKeys } from "../api/organization.keys";
import { organizationService } from "../api/organization.service";
import {
  type CreateTeamInput,
  type CreateUnitInput,
  type DeactivateTeamArgs,
  type DeactivateUnitArgs,
  type ReplaceTeamMembersArgs,
  type UpdateTeamArgs,
  type UpdateUnitArgs,
} from "../types/organization.types";

export function useCreateUnitMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...organizationKeys.viewer(viewerId), "createUnit"],
    mutationFn: (input: CreateUnitInput) =>
      run(input, (key) =>
        organizationService.createUnit(input, {
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}

export function useUpdateUnitMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...organizationKeys.viewer(viewerId), "updateUnit"],
    mutationFn: (input: UpdateUnitArgs) =>
      run(input, (key) =>
        organizationService.updateUnit(input.unitId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}

export function useDeactivateUnitMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...organizationKeys.viewer(viewerId), "deactivateUnit"],
    mutationFn: (input: DeactivateUnitArgs) =>
      run(input, (key) =>
        organizationService.deactivateUnit(input.unitId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}

export function useCreateTeamMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...organizationKeys.viewer(viewerId), "createTeam"],
    mutationFn: (input: CreateTeamInput) =>
      run(input, (key) =>
        organizationService.createTeam(input, {
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}

export function useUpdateTeamMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...organizationKeys.viewer(viewerId), "updateTeam"],
    mutationFn: (input: UpdateTeamArgs) =>
      run(input, (key) =>
        organizationService.updateTeam(input.teamId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}

export function useReplaceTeamMembersMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...organizationKeys.viewer(viewerId), "replaceTeamMembers"],
    mutationFn: (input: ReplaceTeamMembersArgs) =>
      run(input, (key) =>
        organizationService.replaceTeamMembers(input.teamId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}

export function useDeactivateTeamMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...organizationKeys.viewer(viewerId), "deactivateTeam"],
    mutationFn: (input: DeactivateTeamArgs) =>
      run(input, (key) =>
        organizationService.deactivateTeam(input.teamId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}
