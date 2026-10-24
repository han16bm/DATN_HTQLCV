import type { AnalyticsQuery } from "@/features/analytics/types/analytics.types";
import { type SummaryDto } from "@/features/analytics/types/analytics.types";
import { bottlenecks } from "@/mocks/db/analytics/bottlenecks";
import { dashboard } from "@/mocks/db/analytics/dashboard";
import type { User } from "@/mocks/db/database";
import { db } from "@/mocks/db/database";
export function summary(u: User, query: AnalyticsQuery): SummaryDto {
  const dash = dashboard(u, query);
  const b = bottlenecks(u, query);
  return {
    metadata: dash.metadata,
    overviewRef: dash.overviewRef,
    summaryText: db.details.get(dash.overviewRef.analysisId)!.systemSummary,
    metrics: db.details.get(dash.overviewRef.analysisId)!.snapshot.metrics,
    highlights: b.items.map((i, index) => ({
      id: `highlight-${index}`,
      title: i.taskTitle,
      description: i.evidence.join(" "),
      severity: "MEDIUM",
      analysisRef: i.analysisRef,
    })),
  };
}
