"use client";
import { RecordStamp } from "@/components/ui/record-stamp";
import { SplitLayout } from "@/components/patterns/split-layout";

import { PageSkeleton } from "@/components/ui/loading";
import {
  StatusField,
  ButtonLink,
  PageHeader,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { AnalysisLink } from "@/features/analytics/components/analysis-links";
import { dateTime, label } from "@/lib/format";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useGetAlertQuery } from "../hooks/use-alerts-queries";
import { AlertForm } from "./alert-form";

export function AlertDetailPage({ alertId }: { alertId: string }) {
  const q = useGetAlertQuery(alertId);
  useCrumbLabel(
    "alert",
    alertId,
    q.data && (q.data.taskTitle ?? label(q.data.type)),
  );
  if (q.isError) return <QueryErrorState error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageSkeleton />;
  const a = q.data;
  return (
    <>
      <PageHeader
        title={label(a.type)}
        status={
          <>
            <StatusField label="Mức độ" value={a.severity} />
            <StatusField value={a.status} />
          </>
        }
      />
      <SplitLayout
        aside={
          <aside aria-label="Xử lý cảnh báo" className="grid gap-3">
            <Panel title="Thông tin xử lý">
              <dl className="m-0 grid gap-y-2 text-sm [&>div]:grid [&>div]:grid-cols-[7rem_minmax(0,1fr)] [&>div]:items-baseline [&>div]:gap-x-3 [&_dt]:text-fg-subtle [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:text-left [&_dd]:break-words">
                <div>
                  <dt>Tiếp nhận</dt>
                  <dd>{dateTime(a.createdAt)}</dd>
                </div>
                <div>
                  <dt>Người xử lý gần nhất</dt>
                  <dd>
                    {a.handler ? (
                      <UserBadge name={a.handler.displayName} />
                    ) : (
                      "Chưa có"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Thời điểm</dt>
                  <dd>{dateTime(a.handledAt)}</dd>
                </div>
                <div>
                  <dt>Hướng xử lý hoặc lý do</dt>
                  <dd className="whitespace-pre-wrap">
                    {a.resolutionNote ?? "Chưa ghi nhận"}
                  </dd>
                </div>
              </dl>
              <RecordStamp
                createdBy={a.createdBy}
                createdAt={a.createdAt}
                updatedBy={a.updatedBy}
                updatedAt={a.updatedAt}
              />
            </Panel>
            {a.canHandle && (
              <AlertForm key={a.id} value={a} reload={() => q.refetch()} />
            )}
          </aside>
        }
      >
        <Panel title="Nguyên nhân và bằng chứng">
          <p>
            {a.conditionActive
              ? "Điều kiện phát sinh vẫn còn."
              : "Điều kiện phát sinh đã hết; lịch sử xử lý được giữ lại."}
          </p>
          {a.evidence.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
          <p className="text-xs text-fg-subtle">
            Dữ liệu đến {dateTime(a.dataAsOf)} · {a.methodVersion}
          </p>
          <div className="actions flex flex-wrap items-center gap-2 mt-4">
            {a.analysisRef && (
              <AnalysisLink
                value={a.analysisRef}
                label="Xem chi tiết phân tích"
              />
            )}
            {a.taskId && (
              <ButtonLink href={`/tasks/${a.taskId}`}>Mở công việc</ButtonLink>
            )}
          </div>
        </Panel>
      </SplitLayout>
    </>
  );
}
