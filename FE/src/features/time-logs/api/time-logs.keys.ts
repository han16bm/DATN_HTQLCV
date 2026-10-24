import { type TimeLogQuery } from "@/features/time-logs/types/time-logs.types";
export const timeLogsKeys = {
  all: ["time-logs"] as const,
  viewer: (viewerId: string) => ["time-logs", viewerId] as const,
  listTimeLogs: (viewerId: string, taskId: string, query: TimeLogQuery) =>
    ["time-logs", viewerId, "listTimeLogs", taskId, query] as const,
};
