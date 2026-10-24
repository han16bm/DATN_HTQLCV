"use client";
import { authKeys } from "@/features/auth/api/auth.keys";
import { projectMembersKeys } from "@/features/project-members/api/project-members.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { usersKeys } from "@/features/users/api/users.keys";
import {
  type CreateUserInput,
  type LockUserArgs,
  type ResetUserPasswordArgs,
  type UnlockUserArgs,
  type UpdateUserArgs,
} from "@/features/users/types/users.types";
import { useSession } from "@/lib/auth/session-context";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { usersService } from "../api/users.service";

export function useCreateUserMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  const [requests] = useState(() =>
    createRequestTickets(async (input: CreateUserInput) =>
      usersService.createUser(input, {
        key: await attempt.keyFor(input),
      }),
    ),
  );
  const mutation = useMutation({
    mutationKey: ["users", viewerId, "createUser"],
    mutationFn: requests.execute,
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await client.invalidateQueries({ queryKey: usersKeys.viewer(viewerId) });
    },
  });
  return {
    ...mutation,
    mutateAsync: (payload: CreateUserInput) =>
      mutation.mutateAsync(requests.put(payload)),
    mutate: (payload: CreateUserInput) => {
      void mutation.mutateAsync(requests.put(payload)).catch(() => {});
    },
  };
}
export function useUpdateUserMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["users", viewerId, "updateUser"],
    mutationFn: async (input: UpdateUserArgs) =>
      usersService.updateUser(input.userId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: usersKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
      ]);
    },
  });
}
export function useLockUserMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["users", viewerId, "lockUser"],
    mutationFn: async (input: LockUserArgs) =>
      usersService.lockUser(input.userId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: usersKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
      ]);
    },
  });
}
export function useUnlockUserMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["users", viewerId, "unlockUser"],
    mutationFn: async (input: UnlockUserArgs) =>
      usersService.unlockUser(input.userId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: usersKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function useResetUserPasswordMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  const [requests] = useState(() =>
    createRequestTickets(async (input: ResetUserPasswordArgs) =>
      usersService.resetUserPassword(input.userId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    ),
  );
  const mutation = useMutation({
    mutationKey: ["users", viewerId, "resetUserPassword"],
    mutationFn: requests.execute,
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: usersKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
      ]);
    },
  });
  return {
    ...mutation,
    mutateAsync: (payload: ResetUserPasswordArgs) =>
      mutation.mutateAsync(requests.put(payload)),
    mutate: (payload: ResetUserPasswordArgs) => {
      void mutation.mutateAsync(requests.put(payload)).catch(() => {});
    },
  };
}
