"use client";

import { useSession } from "@/lib/auth/session-context";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { authKeys } from "../api/auth.keys";
import { authService } from "../api/auth.service";
import type {
  ChangePasswordInput,
  LoginInput,
  UpdateProfileArgs,
} from "../types/auth.types";

export function useChangePasswordMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const [requests] = useState(() =>
    createRequestTickets((input: ChangePasswordInput) =>
      run(input, (key) => authService.changePassword(input, { key })),
    ),
  );
  const mutation = useMutation({
    mutationKey: [...authKeys.viewer(viewerId), "changePassword"],
    mutationFn: requests.execute,
    onError: handleError,
  });
  return {
    ...mutation,
    mutateAsync: (input: ChangePasswordInput) =>
      mutation.mutateAsync(requests.put(input)),
  };
}

export function useUpdateProfileMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const [requests] = useState(() =>
    createRequestTickets((input: UpdateProfileArgs) =>
      run(input, (key) =>
        authService.updateProfile(input.payload, {
          version: input.version,
          key,
        }),
      ),
    ),
  );
  const mutation = useMutation({
    mutationKey: [...authKeys.viewer(viewerId), "updateProfile"],
    mutationFn: requests.execute,
    onError: handleError,
    onSuccess: async (result) => {
      await client.cancelQueries({ queryKey: authKeys.getSession(viewerId) });
      client.setQueryData(authKeys.getSession(viewerId), result);
      await Promise.all([
        client.invalidateQueries({ queryKey: authKeys.getProfile(viewerId) }),
        client.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] !== "auth" && query.queryKey[1] === viewerId,
        }),
      ]);
    },
  });
  return {
    ...mutation,
    mutateAsync: (input: UpdateProfileArgs) =>
      mutation.mutateAsync(requests.put(input)),
  };
}

export function useLoginMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const [requests] = useState(() => createRequestTickets(authService.login));
  const mutation = useMutation({
    mutationKey: [...authKeys.viewer(viewerId), "login"],
    mutationFn: requests.execute,
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
