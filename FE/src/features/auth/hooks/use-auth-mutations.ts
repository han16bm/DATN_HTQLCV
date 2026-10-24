"use client";
import { type LoginInput } from "@/features/auth/types/auth.types";
import { useSession } from "@/lib/auth/session-context";
import { createRequestTickets } from "@/lib/query/mutation-requests";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { authService } from "../api/auth.service";

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
export function useLogoutMutation() {
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  return useMutation({
    mutationKey: ["auth", viewerId, "logout"],
    mutationFn: () => authService.logout(),
    retry: false,
    onError: handleError,
  });
}
