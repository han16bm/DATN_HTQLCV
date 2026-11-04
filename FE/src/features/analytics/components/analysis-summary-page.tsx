"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Panel } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { DataTable } from "@/components/patterns/data-table";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { metricValue } from "@/lib/format";
import { useGetAnalysisSummaryQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import { AnalysisLink } from "./analysis-links";
import { Metadata } from "./analysis-metadata";
import { AnalyticsFrame } from "./analytics-frame";
export function AnalysisSummaryPage() {
  const scope = useAnalyticsScope();
  const query = useGetAnalysisSummaryQuery(scope.query, {
    enabled: scope.parsed.success,
  });
  return (
    <AnalyticsFrame scope={scope} title="Tổng hợp phân tích và đề xuất">
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton />
      ) : (
        <>
          <Metadata value={query.data.metadata} />
          <Panel title="Tổng hợp theo số liệu" className="max-w-[760px]">
            <p className="whitespace-pre-wrap">{query.data.summaryText}</p>
            <AnalysisLink
              value={query.data.overviewRef}
              label="Mở diễn giải và đề xuất AI"
            />
          </Panel>
          <DataTable
            loading={query.isFetching}
            title="Điểm cần chú ý"
            actions
            widths={[26, 45, 15, 14]}
            headers={["Đối tượng", "Căn cứ", "Mức độ", "Hành động"]}
            rows={query.data.highlights.map((h) => [
              h.title,
              h.description,
              <StatusLozenge key="severity" value={h.severity} />,
              <AnalysisLink key="analysis" value={h.analysisRef} />,
            ])}
          />
          <DataTable
            loading={query.isFetching}
            title="Thông số và dữ liệu cần bổ sung"
            widths={[30, 15, 55]}
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
