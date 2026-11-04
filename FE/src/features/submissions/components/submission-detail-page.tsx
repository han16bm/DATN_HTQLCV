"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { SplitLayout } from "@/components/patterns/split-layout";
import {
  PageHeader,
  Panel,
  StatusField,
  linkClass,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { AttachmentViewer } from "@/features/attachments/components/attachment-viewer";
import { useGetTaskQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { dateTime, hours } from "@/lib/format";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useGetSubmissionQuery } from "../hooks/use-submissions-queries";
export function SubmissionDetailPage({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const q = useGetSubmissionQuery(taskId, submissionId);
  const task = useGetTaskQuery(taskId);
  useCrumbLabel(
    "submission",
    submissionId,
    q.data && `Lần nộp ${q.data.sequence}`,
  );
  if (q.isError) return <QueryErrorState error={q.error} retry={q.refetch} />;
  if (task.isError) return <QueryErrorState error={task.error} />;
  if (!q.data || !task.data) return <PageSkeleton />;
  const s = q.data;
  const t = task.data;
  return (
    <>
      <PageHeader
        title={`Đối chiếu kết quả · Lần ${s.sequence}`}
        level={2}
        status={<StatusField value={s.status} />}
      />
      <SplitLayout
        aside={
          <aside aria-label="Thông tin nghiệm thu" className="grid gap-3">
            <Panel title="Tiêu chí nghiệm thu">
              <p className="m-0 text-sm whitespace-pre-wrap text-fg">
                {t.acceptanceCriteria}
              </p>
            </Panel>
            <Panel title="Thông tin lần nộp">
              <KeyValueList>
                <KeyValue label="Hạn tại lúc nộp">
                  {dateTime(s.dueAtSnapshot)}
                </KeyValue>
                <KeyValue label="Tình trạng nộp">
                  {s.submittedAt > s.dueAtSnapshot
                    ? "Nộp sau hạn"
                    : "Nộp trong hạn"}
                </KeyValue>
                <KeyValue label="Giờ công tại lúc nộp">
                  {hours(s.actualMinutesSnapshot)}
                </KeyValue>
              </KeyValueList>
            </Panel>
          </aside>
        }
      >
        <Panel title="Kết quả đã nộp">
          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-fg-subtle">
            <UserBadge name={s.submitter.displayName} />
            <time dateTime={s.submittedAt}>{dateTime(s.submittedAt)}</time>
          </p>
          <p className="m-0 text-sm whitespace-pre-wrap text-fg">{s.summary}</p>
          {s.links.map((url, i) => (
            <p key={i} className="m-0 text-sm">
              <a
                className={linkClass}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {url}
              </a>
            </p>
          ))}
        </Panel>
        <AttachmentViewer attachmentIds={s.attachmentIds} />
        {s.reviewedAt && (
          <Panel title="Kết quả nghiệm thu">
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-fg-subtle">
              {s.reviewer && <UserBadge name={s.reviewer.displayName} />}
              <time dateTime={s.reviewedAt}>{dateTime(s.reviewedAt)}</time>
            </p>
            <p className="m-0 text-sm whitespace-pre-wrap text-fg">
              {s.reviewComment || "Không có nhận xét bổ sung."}
            </p>
            {s.requestedChanges && (
              <p className="m-0 text-sm whitespace-pre-wrap text-fg">
                Nội dung cần sửa: {s.requestedChanges}
              </p>
            )}
          </Panel>
        )}
      </SplitLayout>
    </>
  );
}
