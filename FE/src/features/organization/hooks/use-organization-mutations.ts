"use client";
import { organizationKeys } from "@/features/organization/api/organization.keys";
import {
  type CreateTeamInput,
  type CreateUnitInput,
  type DeactivateTeamArgs,
  type DeactivateUnitArgs,
  type ReplaceTeamMembersArgs,
  type UpdateTeamArgs,
  type UpdateUnitArgs,
} from "@/features/organization/types/organization.types";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "../api/organization.service";

export function useCreateUnitMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["organization", viewerId, "createUnit"],
    mutationFn: async (input: CreateUnitInput) =>
      organizationService.createUnit(input, {
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}
export function useUpdateUnitMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["organization", viewerId, "updateUnit"],
    mutationFn: async (input: UpdateUnitArgs) =>
      organizationService.updateUnit(input.unitId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}
export function useDeactivateUnitMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["organization", viewerId, "deactivateUnit"],
    mutationFn: async (input: DeactivateUnitArgs) =>
      organizationService.deactivateUnit(input.unitId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}
export function useCreateTeamMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["organization", viewerId, "createTeam"],
    mutationFn: async (input: CreateTeamInput) =>
      organizationService.createTeam(input, {
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}
export function useUpdateTeamMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["organization", viewerId, "updateTeam"],
    mutationFn: async (input: UpdateTeamArgs) =>
      organizationService.updateTeam(input.teamId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}
export function useReplaceTeamMembersMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["organization", viewerId, "replaceTeamMembers"],
    mutationFn: async (input: ReplaceTeamMembersArgs) =>
      organizationService.replaceTeamMembers(input.teamId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}
export function useDeactivateTeamMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["organization", viewerId, "deactivateTeam"],
    mutationFn: async (input: DeactivateTeamArgs) =>
      organizationService.deactivateTeam(input.teamId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({
        queryKey: organizationKeys.viewer(viewerId),
      });
    },
  });
}
