"use client";
import { Badge, DataTable, Panel } from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Metadata } from "@/features/analytics/components/analysis-metadata";
import { useGetAnalysisSummaryQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import { AnalysisLink } from "./analysis-links";
import { metricValue } from "@/lib/format";
import { AnalyticsFrame } from "./analytics-frame";
export function AnalysisSummaryPage() {
  const scope = useAnalyticsScope();
  const query = useGetAnalysisSummaryQuery(scope.query, {
    enabled: scope.parsed.success,
  });
  return (
    <AnalyticsFrame scope={scope} title="Tổng hợp phân tích và đề xuất">
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <PageSkeleton />
      ) : (
        <>
          <Metadata value={query.data.metadata} />
          <Panel title="Tổng hợp theo số liệu">
            <p className="preserve-lines">{query.data.summaryText}</p>
            <AnalysisLink
              value={query.data.overviewRef}
              label="Mở diễn giải và đề xuất AI"
            />
          </Panel>
          <DataTable
            title="Điểm cần chú ý"
            actions
            headers={["Đối tượng", "Căn cứ", "Mức độ", "Hành động"]}
            rows={query.data.highlights.map((h) => [
              h.title,
              h.description,
              <Badge key="severity" value={h.severity} />,
              <AnalysisLink key="analysis" value={h.analysisRef} />,
            ])}
          />
          <DataTable
            title="Thông số và dữ liệu cần bổ sung"
            headers={["Chỉ số", "Giá trị", "Ý nghĩa"]}
            rows={query.data.metrics.map((m) => [
              m.label,
              metricValue(m.value, m.unit),
              m.formula,
            ])}
          />
        </>
      )}
    </AnalyticsFrame>
  );
}
