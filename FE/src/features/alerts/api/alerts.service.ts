// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./alerts.contract";
export const alertsService = {
  listAlerts: (request: ContractRequest<typeof contracts.listAlertsContract>) =>
    apiClient.request(contracts.listAlertsContract, request),
  getAlert: (request: ContractRequest<typeof contracts.getAlertContract>) =>
    apiClient.request(contracts.getAlertContract, request),
  updateAlert: (
    request: ContractRequest<typeof contracts.updateAlertContract>,
  ) => apiClient.request(contracts.updateAlertContract, request),
};
