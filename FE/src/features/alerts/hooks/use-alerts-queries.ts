// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/alerts.contract";
import { alertsService } from "../api/alerts.service";
import { alertsKeys } from "../api/alerts.keys";
export function useListAlertsQuery(
  request: ContractRequest<typeof contracts.listAlertsContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listAlertsContract,
    request,
    alertsService.listAlerts,
    alertsKeys.listAlerts,
    options,
  );
}
export function useGetAlertQuery(
  request: ContractRequest<typeof contracts.getAlertContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getAlertContract,
    request,
    alertsService.getAlert,
    alertsKeys.getAlert,
    options,
  );
}
