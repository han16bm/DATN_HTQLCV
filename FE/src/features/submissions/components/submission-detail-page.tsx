"use client";
import { Badge, PageHeader, Panel } from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { EvidenceFile } from "@/features/attachments/components/evidence";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { ReviewForm } from "@/features/submissions/components/review-form";
import { useGetTaskQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { dateTime, hours } from "@/lib/format";
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
  const project = useGetProjectQuery(task.data?.projectId ?? "");
  const { session } = useSession();
  if (q.isError)
    return <QueryErrorState error={q.error} retry={() => void q.refetch()} />;
  if (task.isError) return <QueryErrorState error={task.error} />;
  if (!q.data || !task.data) return <PageSkeleton />;
  const s = q.data;
  const t = task.data;
  const canReview =
    s.status === "PENDING" &&
    t.latestSubmissionId === s.id &&
    t.status === "PENDING_REVIEW" &&
    s.submittedBy !== session?.user.id &&
    hasPermission(session, "TASKS_REVIEW", t.projectId) &&
    project.data?.status === "ACTIVE";
  return (
    <>
      <PageHeader title={`Đối chiếu kết quả · Lần ${s.sequence}`} />
      <div className="submission-layout">
        <Panel title="Tiêu chí nghiệm thu">
          <p className="preserve-lines">{t.acceptanceCriteria}</p>
        </Panel>
        <Panel title="Kết quả đã nộp">
          <Badge value={s.status} />
          <p className="metadata">
            {s.submitter.displayName} · {dateTime(s.submittedAt)}
          </p>
          <p className="preserve-lines">{s.summary}</p>
          <dl className="section-gap">
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
          {s.attachmentIds.map((id) => (
            <EvidenceFile key={id} attachmentId={id} />
          ))}
        </Panel>
        {canReview && (
          <ReviewForm
            key={s.id}
            taskId={taskId}
            submissionId={s.id}
            version={s.version}
          />
        )}
      </div>
      {s.reviewedAt && (
        <Panel title="Kết quả nghiệm thu">
          <p>
            {s.reviewer?.displayName} · {dateTime(s.reviewedAt)}
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
      {!canReview && <p className="notice">Bạn đang xem kết quả đã nộp.</p>}
    </>
  );
}
