"use client";
import { alertsKeys } from "@/features/alerts/api/alerts.keys";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { projectMembersKeys } from "@/features/project-members/api/project-members.keys";
import { projectsKeys } from "@/features/projects/api/projects.keys";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import {
  type AssignTaskArgs,
  type CancelTaskArgs,
  type CreateTaskArgs,
  type PauseTaskArgs,
  type StartTaskArgs,
  type UpdateRemainingEstimateArgs,
  type UpdateTaskArgs,
} from "@/features/tasks/types/tasks.types";
import { useSession } from "@/lib/auth/session-context";
import { useMutationAttempt } from "@/lib/query/use-mutation-attempt";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "../api/tasks.service";

export function useCreateTaskMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["tasks", viewerId, "createTask"],
    mutationFn: async (input: CreateTaskArgs) =>
      tasksService.createTask(input.projectId, input.payload, {
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
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
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["tasks", viewerId, "updateTask"],
    mutationFn: async (input: UpdateTaskArgs) =>
      tasksService.updateTask(input.taskId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
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
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["tasks", viewerId, "assignTask"],
    mutationFn: async (input: AssignTaskArgs) =>
      tasksService.assignTask(input.taskId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
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
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["tasks", viewerId, "startTask"],
    mutationFn: async (input: StartTaskArgs) =>
      tasksService.startTask(input.taskId, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function usePauseTaskMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["tasks", viewerId, "pauseTask"],
    mutationFn: async (input: PauseTaskArgs) =>
      tasksService.pauseTask(input.taskId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
export function useCancelTaskMutation() {
  const client = useQueryClient();
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["tasks", viewerId, "cancelTask"],
    mutationFn: async (input: CancelTaskArgs) =>
      tasksService.cancelTask(input.taskId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
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
  const { session } = useSession();
  const viewerId = session?.user.id ?? "anonymous";
  const handleError = useAccessErrorHandler();
  const attempt = useMutationAttempt();
  return useMutation({
    mutationKey: ["tasks", viewerId, "updateRemainingEstimate"],
    mutationFn: async (input: UpdateRemainingEstimateArgs) =>
      tasksService.updateRemainingEstimate(input.taskId, input.payload, {
        version: input.version,
        key: await attempt.keyFor(input),
      }),
    retry: false,
    onError: handleError,
    onSuccess: async () => {
      attempt.reset();
      await Promise.all([
        client.invalidateQueries({ queryKey: tasksKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: analyticsKeys.viewer(viewerId) }),
        client.invalidateQueries({ queryKey: alertsKeys.viewer(viewerId) }),
      ]);
    },
  });
}
