// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/time-logs.contract";
import { timeLogsService } from "../api/time-logs.service";
export function useCreateTimeLogMutation() {
  return useFeatureMutation(
    contracts.createTimeLogContract,
    timeLogsService.createTimeLog,
  );
}
export function useUpdateTimeLogMutation() {
  return useFeatureMutation(
    contracts.updateTimeLogContract,
    timeLogsService.updateTimeLog,
  );
}
export function useVoidTimeLogMutation() {
  return useFeatureMutation(
    contracts.voidTimeLogContract,
    timeLogsService.voidTimeLog,
  );
}
