"use client";

import { auditLogsKeys } from "@/features/audit-logs/api/audit-logs.keys";
import { ipWhitelistKeys } from "@/features/ip-whitelist/api/ip-whitelist.keys";
import { useSession } from "@/lib/auth/session-context";
import { useIdempotentRequest } from "@/lib/query/use-idempotent-request";
import { useAccessErrorHandler } from "@/lib/query/use-query-access";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsKeys } from "../api/settings.keys";
import { settingsService } from "../api/settings.service";
import type {
  CreateSettingInput,
  UpdateSettingArgs,
} from "../types/settings.types";

function useInvalidateSettings() {
  const client = useQueryClient();
  const viewerId = useSession().session?.user.id;
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: settingsKeys.viewer(viewerId) }),
      // Trạng thái bật/tắt whitelist đọc từ Security:AdminIpWhitelistEnabled.
      client.invalidateQueries({ queryKey: ipWhitelistKeys.viewer(viewerId) }),
      client.invalidateQueries({ queryKey: auditLogsKeys.viewer(viewerId) }),
    ]);
  };
}

export function useCreateSettingMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidateSettings();
  return useMutation({
    mutationKey: [...settingsKeys.viewer(viewerId), "createSetting"],
    mutationFn: (input: CreateSettingInput) =>
      run(input, (key) => settingsService.createSetting(input, { key })),
    onError: handleError,
    onSuccess,
  });
}

export function useUpdateSettingMutation() {
  const viewerId = useSession().session?.user.id;
  const handleError = useAccessErrorHandler();
  const run = useIdempotentRequest();
  const onSuccess = useInvalidateSettings();
  return useMutation({
    mutationKey: [...settingsKeys.viewer(viewerId), "updateSetting"],
    mutationFn: (input: UpdateSettingArgs) =>
      run(input, (key) =>
        settingsService.updateSetting(input.settingId, input.payload, {
          version: input.version,
          key,
        }),
      ),
    onError: handleError,
    onSuccess,
  });
}
