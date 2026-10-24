"use client";
import { DataTable, Loading, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Metadata } from "@/features/analytics/components/analysis-metadata";
import { hours, number } from "@/lib/format";
import Link from "next/link";
import { useGetWorkloadQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import { AnalysisLink } from "./analysis-links";
import { AnalyticsFrame } from "./analytics-frame";
export function WorkloadPage() {
  const scope = useAnalyticsScope();
  const query = useGetWorkloadQuery(scope.query, {
    enabled: scope.parsed.success,
  });
  return (
    <AnalyticsFrame scope={scope} title="Khối lượng công việc">
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
          <Panel>
            <p className="notice">
              Tách việc đang nhận và chờ nghiệm thu. Thiếu lịch khả dụng hoặc
              ước lượng còn lại thì chưa đủ dữ liệu kết luận quá tải.
            </p>
            <DataTable
              headers={[
                "Nhân viên",
                "Đang nhận / chờ xét",
                "Dự kiến gốc / hiện tại",
                "Còn lại",
                "Khả dụng",
                "Tỷ lệ tải",
                "Chi tiết",
              ]}
              rows={query.data.items.map((p) => [
                p.person.displayName,
                `${p.openTaskCount} / ${p.pendingReviewCount}`,
                `${hours(p.originalEstimateMinutes)} / ${hours(p.currentEstimateMinutes)}`,
                p.remainingMinutes === null
                  ? "Chưa đủ dữ liệu"
                  : hours(p.remainingMinutes),
                p.capacityMinutes === null
                  ? "Chưa đủ dữ liệu"
                  : hours(p.capacityMinutes),
                number(p.utilizationRate, "%"),
                <div key="links">
                  <AnalysisLink value={p.analysisRef} />
                  <p>
                    <Link
                      className="text-link"
                      href={`/tasks?assigneeId=${encodeURIComponent(p.userId)}${scope.query.projectId ? `&projectId=${encodeURIComponent(scope.query.projectId)}` : ""}`}
                    >
                      Xem công việc
                    </Link>
                  </p>
                </div>,
              ])}
            />
          </Panel>
        </>
      )}
    </AnalyticsFrame>
  );
}
