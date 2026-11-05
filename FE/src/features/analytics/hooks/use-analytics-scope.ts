"use client";

import { useSearchParams } from "next/navigation";
import { analyticsQuerySchema } from "../schemas/analytics-query.schema";

export function useAnalyticsScope() {
  const search = useSearchParams();
  const params = new URLSearchParams(search);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (!params.has("from")) params.set("from", today.slice(0, 8) + "01");
  if (!params.has("to")) params.set("to", today);
  const raw = Object.fromEntries(
    [...params].filter(
      ([key, value]) =>
        [
          "unitId",
          "projectId",
          "ownerId",
          "assigneeId",
          "status",
          "priority",
          "from",
          "to",
          "teamId",
        ].includes(key) && value,
    ),
  );
  const parsed = analyticsQuerySchema.safeParse(raw);
  return {
    parsed,
    query: parsed.success ? parsed.data : { from: "", to: "" },
  };
}
