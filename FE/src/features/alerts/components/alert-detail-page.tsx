"use client";
import {
  Badge,
  ButtonLink,
  Loading,
  PageHeader,
  Panel,
  PermissionGate,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { AlertForm } from "@/features/alerts/components/alert-form";
import { AnalysisLink } from "@/features/analytics/components/analysis-links";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { dateTime, label } from "@/lib/format";
import { useGetAlertQuery } from "../hooks/use-alerts-queries";
export function AlertDetailPage({ alertId }: { alertId: string }) {
  return (
    <PermissionGate permission="ANALYTICS_VIEW">
      <AlertDetail alertId={alertId} />
    </PermissionGate>
  );
}

function AlertDetail({ alertId }: { alertId: string }) {
  const q = useGetAlertQuery(alertId);
  const { session } = useSession();
  if (q.isError)
    return <QueryErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!q.data) return <Loading />;
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
            <dt>Tiếp nhận</dt>
            <dd>{dateTime(a.createdAt)}</dd>
            <dt>Người xử lý gần nhất</dt>
            <dd>
              {a.handledBy === session?.user.id
                ? session.user.displayName
                : (a.handledBy ?? "Chưa có")}
            </dd>
            <dt>Thời điểm</dt>
            <dd>{dateTime(a.handledAt)}</dd>
            <dt>Hướng xử lý hoặc lý do</dt>
            <dd className="preserve-lines">
              {a.resolutionNote ?? "Chưa ghi nhận"}
            </dd>
          </dl>
        </Panel>
      </div>
      {hasPermission(session, "ALERTS_MANAGE", a.projectId) && (
        <AlertForm key={a.id} value={a} reload={() => q.refetch()} />
      )}
    </>
  );
}
