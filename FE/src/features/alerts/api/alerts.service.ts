import type { AlertsApi } from "@/features/alerts/api/alerts.contract";
import {
  alertRowSchema,
  alertSchema,
} from "@/features/alerts/schemas/alerts.schema";
import {
  type AlertQuery,
  type UpdateAlertInput,
} from "@/features/alerts/types/alerts.types";
import { page } from "@/lib/validation/common.schema";
import type { RequestOptions, VersionOptions } from "@/services/api-client";
import { apiClient, parseResponse } from "@/services/api-client";
export const alertsService: AlertsApi = {
  listAlerts(query: AlertQuery = {}, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>("/alerts", { ...options, params: query })
      .then(parseResponse(page(alertRowSchema)));
  },
  getAlert(alertId: string, options: RequestOptions = {}) {
    return apiClient
      .get<unknown>(`/alerts/${encodeURIComponent(alertId)}`, options)
      .then(parseResponse(alertSchema));
  },
  updateAlert(
    alertId: string,
    payload: UpdateAlertInput,
    options: VersionOptions,
  ) {
    return apiClient
      .patch<unknown>(
        `/alerts/${encodeURIComponent(alertId)}`,
        payload,
        options,
      )
      .then(parseResponse(alertSchema));
  },
};
