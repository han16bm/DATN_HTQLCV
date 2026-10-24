// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
import { apiClient } from "@/services/api-client";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "./time-logs.contract";
export const timeLogsService = {
  listTimeLogs: (
    request: ContractRequest<typeof contracts.listTimeLogsContract>,
  ) => apiClient.request(contracts.listTimeLogsContract, request),
  createTimeLog: (
    request: ContractRequest<typeof contracts.createTimeLogContract>,
  ) => apiClient.request(contracts.createTimeLogContract, request),
  updateTimeLog: (
    request: ContractRequest<typeof contracts.updateTimeLogContract>,
  ) => apiClient.request(contracts.updateTimeLogContract, request),
  voidTimeLog: (
    request: ContractRequest<typeof contracts.voidTimeLogContract>,
  ) => apiClient.request(contracts.voidTimeLogContract, request),
};
