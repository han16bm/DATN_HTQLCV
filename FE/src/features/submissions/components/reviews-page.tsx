"use client";
import { FilterBar, FilterField } from "@/components/patterns/filter-bar";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hasPermission } from "@/lib/auth/access";

import { DataTable } from "@/components/patterns/data-table";
import { PageSkeleton } from "@/components/ui/loading";
import { DetailLink, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import Link from "next/link";
import { useListReviewQueueQuery } from "../hooks/use-submissions-queries";

export function ReviewsPage() {
  const f = useUrlFilters();
  const q = useListReviewQueueQuery({
    q: f.get("q") || undefined,
    projectId: f.get("projectId") || undefined,
    page: f.page,
  });
  const projects = useListProjectsQuery({ pageSize: 100 });
  const { session } = useSession();
  return (
    <>
      <PageHeader title="Kết quả chờ nghiệm thu" />
      <FilterBar label="Bộ lọc nghiệm thu">
        <FilterField label="Tìm công việc" search>
          <SearchInput
            placeholder="Nhập tên công việc…"
            value={f.get("q")}
            onChange={(e) => f.set("q", e.target.value)}
          />
        </FilterField>
        <FilterField label="Dự án">
          <Select
            fit
            value={f.get("projectId")}
            onChange={(e) => f.set("projectId", e.target.value)}
          >
            <option value="">Tất cả dự án</option>
            {projects.data?.items
              .filter((p) => hasPermission(session, "TASKS_REVIEW", p.id))
              .map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
          </Select>
        </FilterField>
      </FilterBar>
      {projects.isError && (
        <QueryErrorState error={projects.error} retry={projects.refetch} />
      )}
      {q.isError ? (
        <QueryErrorState error={q.error} retry={q.refetch} />
      ) : !q.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          loading={q.isFetching}
          pagination={{
            ...q.data.pagination,
            onPage: (p) => f.set("page", String(p)),
          }}
          widths={[26, 8, 18, 18, 19, 11]}
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
            <Link
              key="task"
              className="block max-w-[30ch] truncate font-medium text-fg hover:text-selected-fg hover:underline"
              title={s.taskTitle}
              href={`/tasks/${s.taskId}/submissions/${s.id}`}
            >
              {s.taskTitle}
            </Link>,
            String(s.sequence),
            <UserBadge key="submitter" name={s.submitter.displayName} />,
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
