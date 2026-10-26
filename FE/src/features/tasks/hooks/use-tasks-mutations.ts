"use client";

import { alertsKeys } from "@/features/alerts/api/alerts.keys";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { projectMembersKeys } from "@/features/project-members/api/project-members.keys";
import { projectsKeys } from "@/features/projects/api/projects.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksKeys } from "../api/tasks.keys";
import { tasksService } from "../api/tasks.service";
import {
  type AssignTaskArgs,
  type CancelTaskArgs,
  type CreateTaskArgs,
  type PauseTaskArgs,
  type StartTaskArgs,
  type UpdateRemainingEstimateArgs,
  type UpdateTaskArgs,
} from "../types/tasks.types";

export function useCreateTaskMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...tasksKeys.viewer(viewerId), "createTask"],
    mutationFn: (input: CreateTaskArgs) =>
      run(input, (key) =>
        tasksService.createTask(input.projectId, input.payload, {
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useUpdateTaskMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...tasksKeys.viewer(viewerId), "updateTask"],
    mutationFn: (input: UpdateTaskArgs) =>
      run(input, (key) =>
        tasksService.updateTask(input.taskId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useAssignTaskMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...tasksKeys.viewer(viewerId), "assignTask"],
    mutationFn: (input: AssignTaskArgs) =>
      run(input, (key) =>
        tasksService.assignTask(input.taskId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({
          queryKey: projectMembersKeys.viewer(viewerId),
        }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useStartTaskMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...tasksKeys.viewer(viewerId), "startTask"],
    mutationFn: (input: StartTaskArgs) =>
      run(input, (key) =>
        tasksService.startTask(input.taskId, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function usePauseTaskMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...tasksKeys.viewer(viewerId), "pauseTask"],
    mutationFn: (input: PauseTaskArgs) =>
      run(input, (key) =>
        tasksService.pauseTask(input.taskId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useCancelTaskMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...tasksKeys.viewer(viewerId), "cancelTask"],
    mutationFn: (input: CancelTaskArgs) =>
      run(input, (key) =>
        tasksService.cancelTask(input.taskId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: projectsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}

export function useUpdateRemainingEstimateMutation() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  return useMutation({
    mutationKey: [...tasksKeys.viewer(viewerId), "updateRemainingEstimate"],
    mutationFn: (input: UpdateRemainingEstimateArgs) =>
      run(input, (key) =>
        tasksService.updateRemainingEstimate(input.taskId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
