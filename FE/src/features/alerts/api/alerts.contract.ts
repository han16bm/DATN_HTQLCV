import {
  type AlertDto,
  type AlertList,
  type AlertQuery,
  type UpdateAlertInput,
} from "@/features/alerts/types/alerts.types";
import type { RequestOptions, VersionOptions } from "@/services/api-client";
export interface AlertsApi {
  listAlerts(query?: AlertQuery, options?: RequestOptions): Promise<AlertList>;
  getAlert(alertId: string, options?: RequestOptions): Promise<AlertDto>;
  updateAlert(
    alertId: string,
    payload: UpdateAlertInput,
    options: VersionOptions,
  ): Promise<AlertDto>;
}
