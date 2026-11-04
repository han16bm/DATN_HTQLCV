"use client";

import { HashDialog } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import type { TaskDto } from "@/features/tasks/types/tasks.types";
import { useSession } from "@/lib/auth/session-context";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useGetSubmissionQuery } from "../hooks/use-submissions-queries";
import { ReviewForm } from "./review-form";

export function ReviewDialog({ task }: { task: TaskDto }) {
  const dialog = useHashDialog();
  return (
    <HashDialog name="review" title="Quyết định nghiệm thu">
      {dialog.name === "review" && <ReviewContent task={task} />}
    </HashDialog>
  );
}

function ReviewContent({ task }: { task: TaskDto }) {
  const query = useGetSubmissionQuery(task.id, task.latestSubmissionId ?? "");
  const { session } = useSession();
  const dialog = useHashDialog();
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton variant="form" />;
  if (
    query.data.status !== "PENDING" ||
    query.data.submittedBy === session?.user.id
  )
    return (
      <p className="text-fg-subtle">
        Lần nộp này không thể nghiệm thu. Hãy kiểm tra lại kết quả đã nộp.
      </p>
    );
  return (
    <>
      <p className="mb-3 text-xs text-fg-subtle flex flex-wrap items-center gap-x-3 gap-y-2">
        <span>Lần nộp {query.data.sequence}</span>
        <UserBadge name={query.data.submitter.displayName} />
      </p>
      <p className="whitespace-pre-wrap mt-4">{query.data.summary}</p>
      <ReviewForm
        key={query.data.id}
        submission={query.data}
        reload={query.refetch}
        close={dialog.close}
      />
    </>
  );
}
