"use client";
import {
  Badge,
  ButtonLink,
  Loading,
  PageHeader,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListReportsQuery } from "@/features/reports/hooks/use-reports-queries";
import { useListReviewQueueQuery } from "@/features/submissions/hooks/use-submissions-queries";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { dateTime } from "@/lib/format";
import Link from "next/link";
import { useListProjectsQuery } from "../hooks/use-projects-queries";

export function WorkspaceOverview() {
  const { session } = useSession();
  const projects = useListProjectsQuery({ pageSize: 4 });
  const drafts = useListReportsQuery({
    authorId: session?.user.id,
    status: "DRAFT",
    pageSize: 1,
  });
  const reviews = useListReviewQueueQuery(
    { pageSize: 1 },
    { enabled: hasPermission(session, "TASKS_REVIEW") },
  );
  return (
    <>
      <PageHeader
        title={`Chào ${session?.user.displayName.split(" ").at(-1) ?? "bạn"},`}
        description="Công việc, dự án và các việc cần xử lý trong phạm vi của bạn."
        actions={
          <>
            {hasPermission(session, "ANALYTICS_VIEW") && (
              <ButtonLink href="/dashboard" primary>
                Mở bảng tổng quan
              </ButtonLink>
            )}
            <ButtonLink href="/reports/new">Lập báo cáo</ButtonLink>
          </>
        }
      />
      <div className="metric-grid">
        <Panel title="Dự án tham gia">
          <p className="metric-value">
            {projects.data?.pagination.total ?? "—"}
          </p>
          <Link className="text-link" href="/projects">
            Xem dự án
          </Link>
        </Panel>
        <Panel title="Báo cáo nháp của tôi">
          <p className="metric-value">{drafts.data?.pagination.total ?? "—"}</p>
          <Link className="text-link" href="/reports?status=DRAFT">
            Tiếp tục báo cáo
          </Link>
        </Panel>
        {hasPermission(session, "TASKS_REVIEW") && (
          <Panel title="Kết quả chờ nghiệm thu">
            <p className="metric-value">
              {reviews.data?.pagination.total ?? "—"}
            </p>
            <Link className="text-link" href="/reviews">
              Mở hàng chờ
            </Link>
          </Panel>
        )}
        <Panel title="Việc cần chú ý">
          <p>Công việc mở đã qua hạn hoàn thành</p>
          <Link
            className="text-link"
            href={`/tasks?overdue=true&assigneeId=${session?.user.id ?? ""}`}
          >
            Xem công việc quá hạn của tôi
          </Link>
        </Panel>
      </div>
      {projects.isError ? (
        <QueryErrorState error={projects.error} />
      ) : !projects.data ? (
        <Loading />
      ) : (
        projects.data.items.length > 0 && (
          <Panel title="Dự án đang tham gia">
            <div className="project-grid">
              {projects.data.items.map((p) => (
                <div key={p.id}>
                  <Link className="text-link" href={`/projects/${p.id}`}>
                    {p.name}
                  </Link>
                  <p className="small muted">
                    <Badge value={p.status} /> · Hạn {dateTime(p.dueAt)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        )
      )}
    </>
  );
}
