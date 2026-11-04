"use client";

import { authKeys } from "@/features/auth/api/auth.keys";
import { usersKeys } from "@/features/users/api/users.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsKeys } from "../api/permissions.keys";
import { permissionsService } from "../api/permissions.service";
import type {
  CreatePermissionGroupInput,
  ReplacePermissionGroupMembersArgs,
  SetPermissionGroupStatusArgs,
  UpdateFeatureArgs,
  UpdatePermissionGroupArgs,
} from "../types/permissions.types";

// Đổi nhóm/mã quyền làm đổi quyền hiệu lực: tải lại danh mục, người dùng và phiên.
function useInvalidatePermissions() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: permissionsKeys.viewer(viewerId) }),
      client.invalidateQueries({ queryKey: usersKeys.viewer(viewerId) }),
      client.invalidateQueries({ queryKey: authKeys.viewer(viewerId) }),
    ]);
  };
}

export function useUpdateFeatureMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidatePermissions();
  return useMutation({
    mutationKey: [...permissionsKeys.viewer(viewerId), "updateFeature"],
    mutationFn: (input: UpdateFeatureArgs) =>
      run(input, (key) =>
        permissionsService.updateFeature(input.code, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess,
  });
}

export function useCreatePermissionGroupMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidatePermissions();
  return useMutation({
    mutationKey: [...permissionsKeys.viewer(viewerId), "createPermissionGroup"],
    mutationFn: (input: CreatePermissionGroupInput) =>
      run(input, (key) =>
        permissionsService.createPermissionGroup(input, { key }),
      ),
    onError: handleError,
    onSuccess,
  });
}

export function useUpdatePermissionGroupMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidatePermissions();
  return useMutation({
    mutationKey: [...permissionsKeys.viewer(viewerId), "updatePermissionGroup"],
    mutationFn: (input: UpdatePermissionGroupArgs) =>
      run(input, (key) =>
        permissionsService.updatePermissionGroup(input.groupId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess,
  });
}

export function useReplacePermissionGroupMembersMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidatePermissions();
  return useMutation({
    mutationKey: [
      ...permissionsKeys.viewer(viewerId),
      "replacePermissionGroupMembers",
    ],
    mutationFn: (input: ReplacePermissionGroupMembersArgs) =>
      run(input, (key) =>
        permissionsService.replacePermissionGroupMembers(
          input.groupId,
          input.payload,
          { version: input.version, key },
        ),
      ),
    onError: handleError,
    onSuccess,
  });
}

export function useSetPermissionGroupStatusMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidatePermissions();
  return useMutation({
    mutationKey: [
      ...permissionsKeys.viewer(viewerId),
      "setPermissionGroupStatus",
    ],
    mutationFn: (input: SetPermissionGroupStatusArgs) =>
      run(input, (key) =>
        (input.active
          ? permissionsService.activatePermissionGroup
          : permissionsService.deactivatePermissionGroup)(
          input.groupId,
          input.payload,
          { version: input.version, key },
        ),
      ),
    onError: handleError,
    onSuccess,
  });
}
