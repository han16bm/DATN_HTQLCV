import type { ViewerId } from "@/types/common";
import { type TimeLogQuery } from "../types/time-logs.types";
export const timeLogsKeys = {
  all: ["time-logs"] as const,
  viewer: (viewerId: ViewerId) =>
    ["time-logs", viewerId ?? "anonymous"] as const,
  listTimeLogs: (viewerId: ViewerId, taskId: string, query: TimeLogQuery) =>
    [...timeLogsKeys.viewer(viewerId), "listTimeLogs", taskId, query] as const,
};
