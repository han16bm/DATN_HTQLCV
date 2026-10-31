"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { StatusField, PageHeader, Panel } from "@/components/ui/page";
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
      <div className="issue-layout">
        <div className="issue-main">
          <Panel title="Kết quả đã nộp">
            <p className="metadata person-meta">
              <UserBadge name={s.submitter.displayName} />
              <time dateTime={s.submittedAt}>{dateTime(s.submittedAt)}</time>
            </p>
            <p className="preserve-lines">{s.summary}</p>
            {s.links.map((url, i) => (
              <p key={i}>
                <a
                  className="text-link"
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
              <p className="person-meta">
                {s.reviewer && <UserBadge name={s.reviewer.displayName} />}
                <time dateTime={s.reviewedAt}>{dateTime(s.reviewedAt)}</time>
              </p>
              <p className="preserve-lines">
                {s.reviewComment || "Không có nhận xét bổ sung."}
              </p>
              {s.requestedChanges && (
                <p className="preserve-lines">
                  Nội dung cần sửa: {s.requestedChanges}
                </p>
              )}
            </Panel>
          )}
        </div>
        <aside className="issue-side" aria-label="Thông tin nghiệm thu">
          <Panel title="Tiêu chí nghiệm thu">
            <p className="preserve-lines">{t.acceptanceCriteria}</p>
          </Panel>
          <Panel title="Thông tin lần nộp">
            <dl className="record-details">
              <div>
                <dt>Hạn tại lúc nộp</dt>
                <dd>{dateTime(s.dueAtSnapshot)}</dd>
              </div>
              <div>
                <dt>Tình trạng nộp</dt>
                <dd>
                  {s.submittedAt > s.dueAtSnapshot
                    ? "Nộp sau hạn"
                    : "Nộp trong hạn"}
                </dd>
              </div>
              <div>
                <dt>Giờ công tại lúc nộp</dt>
                <dd>{hours(s.actualMinutesSnapshot)}</dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    </>
  );
}
