"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { SplitLayout } from "@/components/patterns/split-layout";
import { Notice } from "@/components/ui/notice";
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
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <UserBadge name={r.author.displayName} />
            <span>{project.data?.name ?? "Đang tải dự án…"}</span>
          </span>
        }
        status={<StatusField value={r.status} />}
      />
      {r.status === "SUBMITTED" && r.snapshot ? (
        <SplitLayout
          aside={
            <aside aria-label="Số liệu đã chốt">
              <Panel title="Thông tin báo cáo">
                <KeyValueList>
                  <KeyValue label="Giờ công">
                    {hours(r.snapshot.totalMinutes)}
                  </KeyValue>
                  <KeyValue label="Chốt số liệu">
                    {dateTime(r.snapshot.dataAsOf)}
                  </KeyValue>
                </KeyValueList>
                <p className="m-0 text-xs text-fg-subtle">
                  Nội dung và số liệu được lưu tại thời điểm gửi.
                </p>
              </Panel>
            </aside>
          }
        >
          <Panel title="Nội dung báo cáo">
            <div className="grid gap-4">
              {[
                ["Kết quả thực hiện", r.achievements],
                ["Khó khăn", r.blockers || "Không có khó khăn bổ sung."],
                ["Kế hoạch tiếp theo", r.nextPlan],
              ].map(([title, text], index) => (
                <section
                  key={title}
                  className={index ? "border-t border-line pt-3" : undefined}
                >
                  <h3 className="m-0 mb-1 text-sm font-semibold text-fg">
                    {title}
                  </h3>
                  <p className="m-0 max-w-[80ch] text-sm leading-relaxed whitespace-pre-wrap text-fg">
                    {text}
                  </p>
                </section>
              ))}
              {r.zeroTimeReason && (
                <p className="m-0 text-sm">
                  Lý do không có giờ công: {r.zeroTimeReason}
                </p>
              )}
            </div>
          </Panel>
          <ReportNumbers value={r.snapshot} frozen />
        </SplitLayout>
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
            <p className="m-0 text-sm">Báo cáo đang ở bản nháp.</p>
            <ButtonLink href={`/reports/${r.id}/edit`}>Mở bản nháp</ButtonLink>
          </Panel>
        )
      ) : (
        <Notice>
          Báo cáo chỉ được tra cứu trong trạng thái dự án hiện tại.
        </Notice>
      )}
    </>
  );
}
