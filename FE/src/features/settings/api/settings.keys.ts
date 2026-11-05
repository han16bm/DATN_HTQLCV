import type { ViewerId } from "@/types/common";
import type { SettingQuery } from "../types/settings.types";
export const settingsKeys = {
  viewer: (viewerId: ViewerId) =>
    ["settings", viewerId ?? "anonymous"] as const,
  listSettings: (viewerId: ViewerId, query: SettingQuery) =>
    [...settingsKeys.viewer(viewerId), "listSettings", query] as const,
};
