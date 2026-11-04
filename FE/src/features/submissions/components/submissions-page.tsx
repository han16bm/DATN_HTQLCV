"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { DetailLink } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { DataTable } from "@/components/patterns/data-table";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListSubmissionsQuery } from "../hooks/use-submissions-queries";
export function SubmissionsPage({ taskId }: { taskId: string }) {
  const f = useUrlFilters();
  const q = useListSubmissionsQuery(taskId, { page: f.page });
  if (q.isError) return <QueryErrorState error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageSkeleton variant="table" />;
  return (
    <DataTable
      loading={q.isFetching}
      title="Các lần nộp kết quả"
      pagination={{
        ...q.data.pagination,
        onPage: (p) => f.set("page", String(p)),
      }}
      actions
      widths={[12, 26, 24, 22, 16]}
      headers={[
        "Lần nộp",
        "Người nộp",
        "Thời điểm",
        "Kết quả xét",
        "Hành động",
      ]}
      rows={q.data.items.map((s) => [
        `Lần ${s.sequence}`,
        <UserBadge key="submitter" name={s.submitter.displayName} />,
        dateTime(s.submittedAt),
        <StatusLozenge key="state" value={s.status} />,
        <DetailLink
          key="detail"
          href={`/tasks/${taskId}/submissions/${s.id}`}
          label={`Xem lần nộp ${s.sequence}`}
        />,
      ])}
    />
  );
}
