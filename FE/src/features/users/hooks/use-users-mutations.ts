"use client";

import { authKeys } from "@/features/auth/api/auth.keys";
import { projectMembersKeys } from "@/features/project-members/api/project-members.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { useSession } from "@/lib/auth/session-context";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { usersKeys } from "../api/users.keys";
import { usersService } from "../api/users.service";
import {
  type CreateUserInput,
  type LockUserArgs,
  type ResetUserPasswordArgs,
  type UnlockUserArgs,
  type UpdateUserArgs,
} from "../types/users.types";

export function useCreateUserMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const [requests] = useState(() =>
    createRequestTickets((input: CreateUserInput) =>
      run(input, (key) =>
        usersService.createUser(input, {
          key,
        }),
      ),
    ),
  );
  const mutation = useMutation({
    mutationKey: [...usersKeys.viewer(viewerId), "createUser"],
    mutationFn: requests.execute,
    onError: handleError,
    onSuccess: async () => {
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
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...usersKeys.viewer(viewerId), "updateUser"],
    mutationFn: (input: UpdateUserArgs) =>
      run(input, (key) =>
        usersService.updateUser(input.userId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
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
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...usersKeys.viewer(viewerId), "lockUser"],
    mutationFn: (input: LockUserArgs) =>
      run(input, (key) =>
        usersService.lockUser(input.userId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
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
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...usersKeys.viewer(viewerId), "unlockUser"],
    mutationFn: (input: UnlockUserArgs) =>
      run(input, (key) =>
        usersService.unlockUser(input.userId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: usersKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useResetUserPasswordMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const [requests] = useState(() =>
    createRequestTickets((input: ResetUserPasswordArgs) =>
      run(input, (key) =>
        usersService.resetUserPassword(input.userId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    ),
  );
  const mutation = useMutation({
    mutationKey: [...usersKeys.viewer(viewerId), "resetUserPassword"],
    mutationFn: requests.execute,
    onError: handleError,
    onSuccess: async () => {
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
