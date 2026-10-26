"use client";
import { canManage } from "@/lib/auth/access";

import { PageSkeleton } from "@/components/ui/loading";
import { Badge, ButtonLink, PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { AnalysisLink } from "@/features/analytics/components/analysis-links";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, label } from "@/lib/format";
import { useGetAlertQuery } from "../hooks/use-alerts-queries";
import { AlertForm } from "./alert-form";

export function AlertDetailPage({ alertId }: { alertId: string }) {
  const q = useGetAlertQuery(alertId);
  const { session } = useSession();
  if (q.isError)
    return <QueryErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!q.data) return <PageSkeleton />;
  const a = q.data;
  return (
    <>
      <PageHeader
        title={label(a.type)}
        description={a.taskTitle ?? "Cảnh báo dự án"}
        actions={<ButtonLink href="/alerts">Danh sách cảnh báo</ButtonLink>}
      />
      <div className="two-column">
        <Panel title="Nguyên nhân và bằng chứng">
          <p className="metadata">
            <Badge value={a.severity} /> <Badge value={a.status} />
          </p>
          <p>
            {a.conditionActive
              ? "Điều kiện phát sinh vẫn còn."
              : "Điều kiện phát sinh đã hết; lịch sử xử lý được giữ lại."}
          </p>
          {a.evidence.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
          <p className="small muted">
            Dữ liệu đến {dateTime(a.dataAsOf)} · {a.methodVersion}
          </p>
          <div className="actions">
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
        <Panel title="Thông tin xử lý">
          <dl>
            <div>
              <dt>Tiếp nhận</dt>
              <dd>{dateTime(a.createdAt)}</dd>
            </div>
            <div>
              <dt>Người xử lý gần nhất</dt>
              <dd>
                {a.handledBy === session?.user.id
                  ? session.user.displayName
                  : (a.handledBy ?? "Chưa có")}
              </dd>
            </div>
            <div>
              <dt>Thời điểm</dt>
              <dd>{dateTime(a.handledAt)}</dd>
            </div>
            <div>
              <dt>Hướng xử lý hoặc lý do</dt>
              <dd className="preserve-lines">
                {a.resolutionNote ?? "Chưa ghi nhận"}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
      {canManage(session, a.projectId) && (
        <AlertForm key={a.id} value={a} reload={() => q.refetch()} />
      )}
    </>
  );
}
