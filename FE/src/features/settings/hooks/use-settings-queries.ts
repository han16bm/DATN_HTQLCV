"use client";

import { useSession } from "@/lib/auth/session-context";
import { useQueryAccess } from "@/lib/query/use-query-access";
import { useQuery } from "@tanstack/react-query";
import { settingsKeys } from "../api/settings.keys";
import { settingsService } from "../api/settings.service";
import { settingQuerySchema } from "../schemas/setting.schema";
import type { SettingQuery } from "../types/settings.types";

export function useListSettingsQuery(query: SettingQuery = {}) {
  const viewerId = useSession().session?.user.id;
  const filters = settingQuerySchema.safeParse(query).data ?? query;
  const result = useQuery({
    queryKey: settingsKeys.listSettings(viewerId, filters),
    queryFn: ({ signal }) => settingsService.listSettings(filters, { signal }),
    enabled: Boolean(viewerId),
    staleTime: 10000,
  });
  return useQueryAccess(result, "settings");
}
