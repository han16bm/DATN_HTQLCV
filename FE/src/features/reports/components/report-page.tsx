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
import { label } from "@/lib/format";
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
  if (q.isError)
    return <QueryErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!q.data) return <PageSkeleton />;
  const r = q.data;
  return (
    <>
      <PageHeader
        title={`${label(r.periodType)} · ${r.periodStart}`}
        description={
          <span className="person-meta">
            <UserBadge name={r.author.displayName} />
            <span>{project.data?.name ?? r.projectId}</span>
          </span>
        }
        status={<StatusField value={r.status} />}
      />
      {r.status === "SUBMITTED" && r.snapshot ? (
        <>
          <ReportNumbers value={r.snapshot} frozen />
          <div className="two-column">
            <Panel title="Kết quả thực hiện" className="text-card">
              <p className="preserve-lines">{r.achievements}</p>
            </Panel>
            <Panel title="Khó khăn và kế hoạch tiếp theo" className="text-card">
              <p className="preserve-lines">
                {r.blockers || "Không có khó khăn bổ sung."}
              </p>
              <h3 className="section-gap">Kế hoạch tiếp theo</h3>
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
