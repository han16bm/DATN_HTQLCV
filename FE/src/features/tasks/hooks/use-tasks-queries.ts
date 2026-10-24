// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import {
  useFeatureQuery,
  type FeatureQueryOptions,
} from "@/lib/query/use-feature-query";
import type { ContractRequest } from "@/services/api-contract";
import * as contracts from "../api/tasks.contract";
import { tasksService } from "../api/tasks.service";
import { tasksKeys } from "../api/tasks.keys";
export function useListTasksQuery(
  request: ContractRequest<typeof contracts.listTasksContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listTasksContract,
    request,
    tasksService.listTasks,
    tasksKeys.listTasks,
    options,
  );
}
export function useGetTaskQuery(
  request: ContractRequest<typeof contracts.getTaskContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.getTaskContract,
    request,
    tasksService.getTask,
    tasksKeys.getTask,
    options,
  );
}
export function useListTaskHistoryQuery(
  request: ContractRequest<typeof contracts.listTaskHistoryContract>,
  options: FeatureQueryOptions = {},
) {
  return useFeatureQuery(
    contracts.listTaskHistoryContract,
    request,
    tasksService.listTaskHistory,
    tasksKeys.listTaskHistory,
    options,
  );
}
