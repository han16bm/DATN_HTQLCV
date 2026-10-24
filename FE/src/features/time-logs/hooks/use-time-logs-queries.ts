// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/time-logs.contract";
import { timeLogsService } from "../api/time-logs.service";
import { timeLogsKeys } from "../api/time-logs.keys";
export function useListTimeLogsQuery(
  request: ContractRequest<typeof contracts.listTimeLogsContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listTimeLogsContract,
    request,
    timeLogsService.listTimeLogs,
    timeLogsKeys.listTimeLogs,
    options,
  );
}
