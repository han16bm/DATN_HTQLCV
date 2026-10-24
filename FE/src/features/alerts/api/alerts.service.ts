import type { AlertsApi } from "@/features/alerts/api/alerts.contract";
import { alertSchema } from "@/features/alerts/schemas/alerts.schema";
import {
  type AlertQuery,
  type UpdateAlertInput,
} from "@/features/alerts/types/alerts.types";
import { page } from "@/lib/validation/common.schema";
import { apiClient } from "@/services/api-client";
import type { RequestOptions, VersionOptions } from "@/services/api.types";
export const alertsService: AlertsApi = {
  listAlerts(query: AlertQuery = {}, options: RequestOptions = {}) {
    return apiClient.get(`/alerts`, page(alertSchema), {
      ...options,
      query,
    });
  },
  getAlert(alertId: string, options: RequestOptions = {}) {
    return apiClient.get(
      `/alerts/${encodeURIComponent(alertId)}`,
      alertSchema,
      options,
    );
  },
  updateAlert(
    alertId: string,
    payload: UpdateAlertInput,
    options: VersionOptions,
  ) {
    return apiClient.patch(
      `/alerts/${encodeURIComponent(alertId)}`,
      payload,
      alertSchema,
      options,
    );
  },
};
