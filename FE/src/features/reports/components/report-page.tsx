"use client";

import { PageSkeleton } from "@/components/ui/loading";
import {
  StatusField,
  ButtonLink,
  PageHeader,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, hours, label } from "@/lib/format";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useGetReportQuery } from "../hooks/use-reports-queries";
import { ReportEditor } from "./report-editor";
import { ReportNumbers } from "./report-numbers";
export function ReportPage({
  reportId,
  edit = false,
}: {
  reportId: string;
  edit?: boolean;
}) {
  const q = useGetReportQuery(reportId);
  const { session } = useSession();
  const project = useGetProjectQuery(q.data?.projectId ?? "");
  useCrumbLabel(
    "report",
    reportId,
    q.data && `${label(q.data.periodType)} · ${q.data.periodStart}`,
  );
  if (q.isError) return <QueryErrorState error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageSkeleton />;
  const r = q.data;
  return (
    <>
      <PageHeader
        title={`${label(r.periodType)} · ${r.periodStart.split("-").reverse().join("/")}`}
        description={
          <span className="person-meta">
            <UserBadge name={r.author.displayName} />
            <span>{project.data?.name ?? "Đang tải dự án…"}</span>
          </span>
        }
        status={<StatusField value={r.status} />}
      />
      {r.status === "SUBMITTED" && r.snapshot ? (
        <div className="report-layout">
          <div className="report-document">
            <Panel title="Nội dung báo cáo">
              <section>
                <h3>Kết quả thực hiện</h3>
                <p className="prose">{r.achievements}</p>
              </section>
              <section className="acceptance-section">
                <h3>Khó khăn</h3>
                <p className="preserve-lines">
                  {r.blockers || "Không có khó khăn bổ sung."}
                </p>
              </section>
              <section className="acceptance-section">
                <h3>Kế hoạch tiếp theo</h3>
                <p className="preserve-lines">{r.nextPlan}</p>
              </section>
              {r.zeroTimeReason && (
                <p>Lý do không có giờ công: {r.zeroTimeReason}</p>
              )}
            </Panel>
            <ReportNumbers value={r.snapshot} frozen />
          </div>
          <aside className="report-context" aria-label="Số liệu đã chốt">
            <Panel title="Thông tin báo cáo">
              <dl className="record-details">
                <div>
                  <dt>Dự án</dt>
                  <dd>{project.data?.name ?? "Đang tải dự án…"}</dd>
                </div>
                <div>
                  <dt>Người lập</dt>
                  <dd>
                    <UserBadge name={r.author.displayName} />
                  </dd>
                </div>
                <div>
                  <dt>Giờ công</dt>
                  <dd>{hours(r.snapshot.totalMinutes)}</dd>
                </div>
                <div>
                  <dt>Chốt số liệu</dt>
                  <dd>{dateTime(r.snapshot.dataAsOf)}</dd>
                </div>
              </dl>
              <p className="small muted">
                Nội dung và số liệu được lưu tại thời điểm gửi.
              </p>
            </Panel>
          </aside>
        </div>
      ) : project.isError ? (
        <QueryErrorState error={project.error} retry={project.refetch} />
      ) : project.isPending ? (
        <PageSkeleton variant="form" />
      ) : r.authorId === session?.user.id &&
        project.data?.status === "ACTIVE" ? (
        edit ? (
          <ReportEditor
            key={r.id}
            report={r}
            projectName={project.data.name}
            reload={() => q.refetch()}
          />
        ) : (
          <Panel>
            <p>Báo cáo đang ở bản nháp.</p>
            <ButtonLink href={`/reports/${r.id}/edit`}>Mở bản nháp</ButtonLink>
          </Panel>
        )
      ) : (
        <p className="notice">
          Báo cáo chỉ được tra cứu trong trạng thái dự án hiện tại.
        </p>
      )}
    </>
  );
}
