"use client";
import { canManage } from "@/lib/auth/access";

import { PageSkeleton } from "@/components/ui/loading";
import { DataTable, DetailLink, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListReviewQueueQuery } from "../hooks/use-submissions-queries";

export function ReviewsPage() {
  const f = useUrlFilters();
  const q = useListReviewQueueQuery({
    projectId: f.get("projectId") || undefined,
    page: f.page,
  });
  const projects = useListProjectsQuery({ pageSize: 100 });
  const { session } = useSession();
  return (
    <>
      <PageHeader title="Kết quả chờ nghiệm thu" />
      <div className="panel filters">
        <label>
          Dự án
          <select
            value={f.get("projectId")}
            onChange={(e) => f.set("projectId", e.target.value)}
          >
            <option value="">Tất cả dự án có quyền xét</option>
            {projects.data?.items
              .filter((p) => canManage(session, p.id))
              .map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      {projects.isError && (
        <QueryErrorState
          error={projects.error}
          retry={() => void projects.refetch()}
        />
      )}
      {q.isError ? (
        <QueryErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !q.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          pagination={{
            ...q.data.pagination,
            onPage: (p) => f.set("page", String(p)),
          }}
          headers={[
            "Công việc",
            "Lần nộp",
            "Người nộp",
            "Nộp lúc",
            "Hạn tại lúc nộp",
            "Hành động",
          ]}
          actions
          rows={q.data.items.map((s) => [
            s.taskTitle,
            String(s.sequence),
            s.submitter.displayName,
            dateTime(s.submittedAt),
            dateTime(s.dueAtSnapshot),
            <DetailLink
              key="detail"
              href={`/tasks/${s.taskId}/submissions/${s.id}`}
              label={`Xem lần nộp ${s.sequence}`}
            />,
          ])}
        />
      )}
    </>
  );
}
