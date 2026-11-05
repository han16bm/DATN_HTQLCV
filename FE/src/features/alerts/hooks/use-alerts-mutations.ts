"use client";

import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsKeys } from "../api/alerts.keys";
import { alertsService } from "../api/alerts.service";
import { type UpdateAlertArgs } from "../types/alerts.types";

export function useUpdateAlertMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...alertsKeys.viewer(viewerId), "updateAlert"],
    mutationFn: (input: UpdateAlertArgs) =>
      run(input, (key) =>
        alertsService.updateAlert(input.alertId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
