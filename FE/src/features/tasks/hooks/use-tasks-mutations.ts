// Generated from fe-specs contract 0.3.0. Rebuild with npm run contracts.
"use client";
import { useFeatureMutation } from "@/lib/query/use-feature-mutation";
import * as contracts from "../api/tasks.contract";
import { tasksService } from "../api/tasks.service";
export function useCreateTaskMutation() {
  return useFeatureMutation(
    contracts.createTaskContract,
    tasksService.createTask,
  );
}
export function useUpdateTaskMutation() {
  return useFeatureMutation(
    contracts.updateTaskContract,
    tasksService.updateTask,
  );
}
export function useAssignTaskMutation() {
  return useFeatureMutation(
    contracts.assignTaskContract,
    tasksService.assignTask,
  );
}
export function useStartTaskMutation() {
  return useFeatureMutation(
    contracts.startTaskContract,
    tasksService.startTask,
  );
}
export function usePauseTaskMutation() {
  return useFeatureMutation(
    contracts.pauseTaskContract,
    tasksService.pauseTask,
  );
}
export function useCancelTaskMutation() {
  return useFeatureMutation(
    contracts.cancelTaskContract,
    tasksService.cancelTask,
  );
}
export function useUpdateRemainingEstimateMutation() {
  return useFeatureMutation(
    contracts.updateRemainingEstimateContract,
    tasksService.updateRemainingEstimate,
  );
}
