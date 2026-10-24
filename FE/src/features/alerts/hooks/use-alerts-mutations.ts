"use client";
import { alertsKeys } from "@/features/alerts/api/alerts.keys";
import { type UpdateAlertArgs } from "@/features/alerts/types/alerts.types";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsService } from "../api/alerts.service";

export function useUpdateAlertMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["alerts", viewerId, "updateAlert"],
    mutationFn: async (input: UpdateAlertArgs) =>
      alertsService.updateAlert(input.alertId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
