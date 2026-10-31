"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Badge, ButtonLink, DataTable } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { hours } from "@/lib/format";
import Link from "next/link";
import { useGetBottlenecksQuery } from "../hooks/use-analytics-queries";
import { useAnalyticsScope } from "../hooks/use-analytics-scope";
import { AnalysisLink } from "./analysis-links";
import { Metadata } from "./analysis-metadata";
import { AnalyticsFrame } from "./analytics-frame";
export function BottlenecksPage() {
  const scope = useAnalyticsScope();
  const query = useGetBottlenecksQuery(scope.query, {
    enabled: scope.parsed.success,
  });
  return (
    <AnalyticsFrame scope={scope} title="Điểm nghẽn quy trình">
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <>
          <Metadata value={query.data.metadata} />
          <DataTable
            actions
            widths={[12, 21, 14, 15, 8, 20, 10]}
            headers={[
              "Khâu xử lý",
              "Công việc",
              "Người nhận",
              "Thời gian tồn đọng",
              "Số vòng sửa",
              "Bằng chứng",
              "Hành động",
            ]}
            rows={query.data.items.map((t) => [
              <Badge key="stage" value={t.stage} />,
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
              `${hours(t.elapsedMinutes)} · ${t.calendarBasis === "CONTINUOUS" ? "Giờ liên tục" : "Theo lịch làm việc"}`,
              String(t.revisionCount),
              t.evidence.join(" "),
              <AnalysisLink
                key="detail"
                value={t.analysisRef}
                label={`Xem điểm nghẽn ${t.taskTitle}`}
              />,
            ])}
          />
          <ButtonLink href="/reviews">Mở hàng chờ nghiệm thu</ButtonLink>
        </>
      )}
    </AnalyticsFrame>
  );
}
