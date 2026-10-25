"use client";
import type {
  LoginInput,
  UpdateProfileArgs,
  ChangePasswordInput,
} from "@/features/auth/types/auth.types";
import { authKeys } from "../api/auth.keys";
import { useSession } from "@/lib/auth/session-context";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { authService } from "../api/auth.service";

export function useChangePasswordMutation() {
  const { session } = useSession();
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  const [requests] = useState(() =>
    createRequestTickets(async (input: ChangePasswordInput) =>
      authService.changePassword(input, { key: await attempt.keyFor(input) }),
    ),
  );
  const mutation = useMutation({
    mutationKey: ["auth", session?.user.id ?? "anonymous", "changePassword"],
    mutationFn: requests.execute,
    retry: false,
    onError: handleError,
    onSuccess: () => attempt.reset(),
  });
  return {
    ...mutation,
    mutateAsync: (input: ChangePasswordInput) =>
      mutation.mutateAsync(requests.put(input)),
  };
}

export function useUpdateProfileMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  const [requests] = useState(() =>
    createRequestTickets(async (input: UpdateProfileArgs) =>
      authService.updateProfile(input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    ),
  );
  const mutation = useMutation({
    mutationKey: ["auth", viewerId, "updateProfile"],
    mutationFn: requests.execute,
    retry: false,
    onError: handleError,
    onSuccess: async (result) => {
      attempt.reset();
      await client.cancelQueries({ queryKey: authKeys.getSession(viewerId) });
      client.setQueryData(authKeys.getSession(viewerId), result);
      await client.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] !== "auth" && query.queryKey[1] === viewerId,
      });
    },
  });
  return {
    ...mutation,
    mutateAsync: (input: UpdateProfileArgs) =>
      mutation.mutateAsync(requests.put(input)),
  };
}

export function useLoginMutation() {
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const [requests] = useState(() => createRequestTickets(authService.login));
  const mutation = useMutation({
    mutationKey: ["auth", viewerId, "login"],
    mutationFn: requests.execute,
    retry: false,
    onError: handleError,
  });
  return {
    ...mutation,
    mutateAsync: (payload: LoginInput) =>
      mutation.mutateAsync(requests.put(payload)),
    mutate: (payload: LoginInput) => {
      void mutation.mutateAsync(requests.put(payload)).catch(() => {});
    },
  };
}
