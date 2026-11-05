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
type Submission = NonNullable<ReturnType<typeof useGetSubmissionQuery>["data"]>;
type Task = NonNullable<ReturnType<typeof useGetTaskQuery>["data"]>;

function ResultContent({ s }: { s: Submission }) {
  return (
    <>
      <p className="m-0 text-sm break-words whitespace-pre-wrap text-fg">
        {s.summary}
      </p>
      {s.links.map((url) => (
        <p key={url} className="m-0 min-w-0 text-sm break-words">
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
    </>
  );
}

function SubmittedResult({ s }: { s: Submission }) {
  return (
    <Panel title="Kết quả đã nộp" compact>
      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-fg-subtle">
        <UserBadge name={s.submitter.displayName} />
        <time dateTime={s.submittedAt}>{dateTime(s.submittedAt)}</time>
      </p>
      <ResultContent s={s} />
    </Panel>
  );
}

function ReviewOutcome({ s }: { s: Submission }) {
  if (!s.reviewedAt) return null;
  return (
    <Panel title="Kết quả nghiệm thu" compact>
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
  );
}

function AcceptanceCriteria({ t }: { t: Task }) {
  return (
    <Panel title="Tiêu chí nghiệm thu" compact>
      <p className="m-0 text-sm whitespace-pre-wrap text-fg">
        {t.acceptanceCriteria}
      </p>
    </Panel>
  );
}

function SubmissionInfo({ s }: { s: Submission }) {
  return (
    <Panel title="Thông tin lần nộp" compact>
      <KeyValueList compact>
        <KeyValue label="Hạn tại lúc nộp">{dateTime(s.dueAtSnapshot)}</KeyValue>
        <KeyValue label="Tình trạng nộp">
          {s.submittedAt > s.dueAtSnapshot ? "Nộp sau hạn" : "Nộp trong hạn"}
        </KeyValue>
        <KeyValue label="Giờ công tại lúc nộp">
          {hours(s.actualMinutesSnapshot)}
        </KeyValue>
      </KeyValueList>
    </Panel>
  );
}

export function SubmissionPreview({
  taskId,
  submissionId,
}: {
  taskId: string;
  submissionId: string;
}) {
  const q = useGetSubmissionQuery(taskId, submissionId);
  if (q.isError) return <QueryErrorState error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageSkeleton />;
  const s = q.data;
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-subtle">
        <span className="font-semibold text-fg">Lần nộp {s.sequence}</span>
        <time dateTime={s.submittedAt}>{dateTime(s.submittedAt)}</time>
        <StatusField label="Kết quả xét" value={s.status} />
      </div>
      <Panel title="Kết quả đã nộp" compact>
        <ResultContent s={s} />
      </Panel>
      <AttachmentViewer key={s.id} attachmentIds={s.attachmentIds} />
      <ReviewOutcome s={s} />
      <SubmissionInfo s={s} />
    </>
  );
}

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
            <AcceptanceCriteria t={task.data} />
            <SubmissionInfo s={s} />
          </aside>
        }
      >
        <SubmittedResult s={s} />
        <AttachmentViewer attachmentIds={s.attachmentIds} />
        <ReviewOutcome s={s} />
      </SplitLayout>
    </>
  );
}
