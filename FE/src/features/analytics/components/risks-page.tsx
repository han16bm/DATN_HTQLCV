"use client";
import { Badge, DataTable, Loading, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Metadata } from "@/features/analytics/components/analysis-metadata";
import Link from "next/link";
import { useGetDeadlineRisksQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import { AnalysisLink } from "./analysis-links";
import { AnalyticsFrame } from "./analytics-frame";
export function RisksPage() {
  const scope = useAnalyticsScope();
  const query = useGetDeadlineRisksQuery(scope.query, {
    enabled: scope.parsed.success,
  });
  return (
    <AnalyticsFrame scope={scope} title="Nguy cơ trễ hạn">
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <Loading />
      ) : (
        <>
          <Metadata value={query.data.metadata} />
          <Panel title="Nguy cơ theo dự án">
            <DataTable
              headers={[
                "Dự án",
                "Mức nguy cơ",
                "Quá hạn / có nguy cơ",
                "Thiếu dữ liệu",
                "Căn cứ",
              ]}
              rows={query.data.projects.map((p) => [
                p.projectName,
                <Badge key="risk" value={p.riskLevel} />,
                `${p.overdueCount} / ${p.atRiskCount}`,
                String(p.insufficientDataCount),
                <div key="source">
                  <p>{p.evidence.join(" ")}</p>
                  <AnalysisLink value={p.analysisRef} />
                </div>,
              ])}
            />
          </Panel>
          <Panel title="Công việc cần đối chiếu">
            <DataTable
              headers={[
                "Công việc",
                "Người nhận",
                "Nhóm nhận định",
                "Căn cứ",
                "Chất lượng",
              ]}
              rows={query.data.items.map((t) => [
                <Link
                  key={t.taskId}
                  href={`/tasks/${t.taskId}`}
                  className="text-link"
                >
                  {t.taskTitle}
                </Link>,
                t.assignee?.displayName ?? "Chưa phân công",
                <Badge key="category" value={t.category} />,
                <div key="evidence">
                  <p>{t.evidence.join(" ")}</p>
                  <AnalysisLink value={t.analysisRef} />
                </div>,
                <Badge key="quality" value={t.quality.status} />,
              ])}
            />
            <p className="small muted">
              Phân loại theo quy tắc; mức nguy cơ không phải xác suất dự báo.
            </p>
          </Panel>
        </>
      )}
    </AnalyticsFrame>
  );
}
