"use client";
import {
  Badge,
  ButtonLink,
  Loading,
  PageHeader,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { ReportEditor } from "@/features/reports/components/report-editor";
import { ReportNumbers } from "@/features/reports/components/report-numbers";
import { useSession } from "@/lib/auth/session-context";
import { label } from "@/lib/format";
import { useGetReportQuery } from "../hooks/use-reports-queries";
export function ReportPage({
  reportId,
  edit = false,
}: {
  reportId: string;
  edit?: boolean;
}) {
  const q = useGetReportQuery(reportId);
  const { session } = useSession();
  const project = useGetProjectQuery(q.data?.projectId ?? "", {
    enabled: Boolean(q.data),
  });
  if (q.isError)
    return <QueryErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!q.data) return <Loading />;
  const r = q.data;
  return (
    <>
      <PageHeader
        title={`${label(r.periodType)} · ${r.periodStart}`}
        description={`${r.author.displayName} · ${project.data?.name ?? r.projectId}`}
        actions={<ButtonLink href="/reports">Danh sách báo cáo</ButtonLink>}
      />
      <p className="metadata">
        <Badge value={r.status} />
      </p>
      {r.status === "SUBMITTED" && r.snapshot ? (
        <>
          <ReportNumbers value={r.snapshot} frozen />
          <div className="two-column">
            <Panel title="Kết quả thực hiện">
              <p className="preserve-lines">{r.achievements}</p>
            </Panel>
            <Panel title="Khó khăn và kế hoạch tiếp theo">
              <p className="preserve-lines">
                {r.blockers || "Không có khó khăn bổ sung."}
              </p>
              <h3>Kế hoạch tiếp theo</h3>
              <p className="preserve-lines">{r.nextPlan}</p>
              {r.zeroTimeReason && (
                <p>Lý do không có giờ công: {r.zeroTimeReason}</p>
              )}
            </Panel>
          </div>
        </>
      ) : r.authorId === session?.user.id &&
        project.data?.status === "ACTIVE" ? (
        edit ? (
          <ReportEditor key={r.id} report={r} reload={() => q.refetch()} />
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
