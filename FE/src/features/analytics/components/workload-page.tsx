"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { DataTable } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { hours, number } from "@/lib/format";
import Link from "next/link";
import { useGetWorkloadQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import { AnalysisLink } from "./analysis-links";
import { Metadata } from "./analysis-metadata";
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
        <PageSkeleton variant="table" />
      ) : (
        <>
          <Metadata value={query.data.metadata} />
          <DataTable
            description={
              <p className="small muted">
                Chưa có lịch làm việc để xác định mức độ bận của nhân sự.
              </p>
            }
            actions
            headers={[
              "Nhân viên",
              "Đang nhận / chờ nghiệm thu",
              "Ước lượng ban đầu / hiện tại",
              "Thời gian còn lại",
              "Thời gian có thể làm việc",
              "Mức độ bận",
              "Hành động",
            ]}
            rows={query.data.items.map((p) => [
              <UserBadge key="person" name={p.person.displayName} />,
              `${p.openTaskCount} / ${p.pendingReviewCount}`,
              `${hours(p.originalEstimateMinutes)} / ${hours(p.currentEstimateMinutes)}`,
              p.remainingMinutes === null
                ? "Chưa đủ dữ liệu"
                : hours(p.remainingMinutes),
              p.capacityMinutes === null
                ? "Chưa đủ dữ liệu"
                : hours(p.capacityMinutes),
              number(p.utilizationRate, "%"),
              <div key="links" className="actions">
                <Link
                  className="detail-link"
                  href={`/tasks?assigneeId=${encodeURIComponent(p.userId)}${scope.query.projectId ? `&projectId=${encodeURIComponent(scope.query.projectId)}` : ""}`}
                >
                  Công việc
                </Link>
                <AnalysisLink
                  value={p.analysisRef}
                  label={`Xem khối lượng của ${p.person.displayName}`}
                />
              </div>,
            ])}
          />
        </>
      )}
    </AnalyticsFrame>
  );
}
