"use client";
import { Badge, DataTable, Loading, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Metadata } from "@/features/analytics/components/analysis-metadata";
import { useGetAnalysisSummaryQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import { AnalysisLink, metricValue } from "./analysis-links";
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
        <Loading />
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
          <Panel title="Điểm cần chú ý">
            <DataTable
              headers={["Đối tượng", "Căn cứ", "Mức độ", "Phân tích"]}
              rows={query.data.highlights.map((h) => [
                h.title,
                h.description,
                <Badge key="severity" value={h.severity} />,
                <AnalysisLink key="analysis" value={h.analysisRef} />,
              ])}
            />
          </Panel>
          <Panel title="Thông số và dữ liệu cần bổ sung">
            <DataTable
              headers={["Chỉ số", "Giá trị", "Cách tính"]}
              rows={query.data.metrics.map((m) => [
                m.label,
                metricValue(m.value, m.unit),
                m.formula,
              ])}
            />
          </Panel>
        </>
      )}
    </AnalyticsFrame>
  );
}
