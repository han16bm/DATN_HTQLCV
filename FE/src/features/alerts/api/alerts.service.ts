import { page } from "@/lib/validation/common.schema";
import {
  type RequestOptions,
  type VersionOptions,
  apiClient,
} from "@/services/api-client";
import { alertRowSchema, alertSchema } from "../schemas/alerts.schema";
import type {
  AlertDto,
  AlertList,
  AlertQuery,
  UpdateAlertInput,
} from "../types/alerts.types";

export const alertsService = {
  async listAlerts(query: AlertQuery = {}, options: RequestOptions = {}) {
    const response = await apiClient.get<AlertList>("/alerts", {
      ...options,
      params: query,
      schema: page(alertRowSchema),
    });
    return response.data;
  },

  async getAlert(alertId: string, options: RequestOptions = {}) {
    const response = await apiClient.get<AlertDto>(
      `/alerts/${encodeURIComponent(alertId)}`,
      { ...options, schema: alertSchema },
    );
    return response.data;
  },

  async updateAlert(
    alertId: string,
    payload: UpdateAlertInput,
    options: VersionOptions,
  ) {
    const response = await apiClient.patch<AlertDto>(
      `/alerts/${encodeURIComponent(alertId)}`,
      payload,
      { ...options, schema: alertSchema },
    );
    return response.data;
  },
};
