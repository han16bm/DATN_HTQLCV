"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Badge, DataTable } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import Link from "next/link";
import { useGetDeadlineRisksQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import { AnalysisLink } from "./analysis-links";
import { Metadata } from "./analysis-metadata";
import { AnalyticsFrame } from "./analytics-frame";
export function RisksPage() {
  const scope = useAnalyticsScope();
  const query = useGetDeadlineRisksQuery(scope.query, {
    enabled: scope.parsed.success,
  });
  return (
    <AnalyticsFrame scope={scope} title="Nguy cơ trễ hạn">
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <>
          <Metadata value={query.data.metadata} />
          <DataTable
            title="Nguy cơ theo dự án"
            actions
            widths={[22, 12, 15, 13, 28, 10]}
            headers={[
              "Dự án",
              "Mức nguy cơ",
              "Quá hạn / có nguy cơ",
              "Thiếu dữ liệu",
              "Căn cứ",
              "Hành động",
            ]}
            rows={query.data.projects.map((p) => [
              p.projectName,
              <Badge key="risk" value={p.riskLevel} />,
              `${p.overdueCount} / ${p.atRiskCount}`,
              String(p.insufficientDataCount),
              p.evidence.join(" "),
              <AnalysisLink
                key="detail"
                value={p.analysisRef}
                label={`Xem nguy cơ của ${p.projectName}`}
              />,
            ])}
          />
          <DataTable
            title="Công việc cần đối chiếu"
            actions
            widths={[25, 16, 15, 23, 11, 10]}
            headers={[
              "Công việc",
              "Người nhận",
              "Nhóm nhận định",
              "Căn cứ",
              "Chất lượng",
              "Hành động",
            ]}
            rows={query.data.items.map((t) => [
              <Link
                key={t.taskId}
                href={`/tasks/${t.taskId}`}
                className="text-link task-name"
                title={t.taskTitle}
              >
                {t.taskTitle}
              </Link>,
              t.assignee ? (
                <UserBadge key="assignee" name={t.assignee.displayName} />
              ) : (
                "Chưa phân công"
              ),
              <Badge key="category" value={t.category} />,
              t.evidence.join(" "),
              <Badge key="quality" value={t.quality.status} />,
              <AnalysisLink
                key="detail"
                value={t.analysisRef}
                label={`Xem phân tích ${t.taskTitle}`}
              />,
            ])}
          />
        </>
      )}
    </AnalyticsFrame>
  );
}
