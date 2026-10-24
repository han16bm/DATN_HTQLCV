"use client";
import { PermissionGate } from "@/components/layout/permission-gate";
import {
  DataTable,
  Loading,
  PageHeader,
  Pagination,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { ReviewTaskLink } from "@/features/submissions/components/review-task-link";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListReviewQueueQuery } from "../hooks/use-submissions-queries";
export function ReviewsPage() {
  return (
    <PermissionGate permission="TASKS_REVIEW">
      <ReviewQueue />
    </PermissionGate>
  );
}

function ReviewQueue() {
  const f = useUrlFilters();
  const q = useListReviewQueueQuery({
    projectId: f.get("projectId") || undefined,
    page: f.page,
  });
  const projects = useListProjectsQuery({ pageSize: 100 });
  const { session } = useSession();
  return (
    <>
      <PageHeader
        title="Kết quả chờ nghiệm thu"
        description="Chỉ hiển thị lần nộp mới nhất đang chờ xét trong phạm vi được cấp quyền."
      />
      <div className="panel filters">
        <label>
          Dự án
          <select
            value={f.get("projectId")}
            onChange={(e) => f.set("projectId", e.target.value)}
          >
            <option value="">Tất cả dự án có quyền xét</option>
            {projects.data?.items
              .filter((p) => hasPermission(session, "TASKS_REVIEW", p.id))
              .map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      {q.isError ? (
        <QueryErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !q.data ? (
        <Loading />
      ) : (
        <Panel>
          <DataTable
            headers={[
              "Công việc / lần nộp",
              "Người nộp",
              "Nộp lúc",
              "Hạn tại lúc nộp",
            ]}
            rows={q.data.items.map((s) => [
              <ReviewTaskLink
                key={s.id}
                taskId={s.taskId}
                submissionId={s.id}
                sequence={s.sequence}
              />,
              s.submitter.displayName,
              dateTime(s.submittedAt),
              dateTime(s.dueAtSnapshot),
            ])}
          />
          <Pagination
            {...q.data.pagination}
            onPage={(p) => f.set("page", String(p))}
          />
        </Panel>
      )}
    </>
  );
}
