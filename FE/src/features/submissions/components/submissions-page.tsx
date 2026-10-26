"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Badge, DataTable, DetailLink } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListSubmissionsQuery } from "../hooks/use-submissions-queries";
export function SubmissionsPage({ taskId }: { taskId: string }) {
  const f = useUrlFilters();
  const q = useListSubmissionsQuery(taskId, { page: f.page });
  if (q.isError)
    return <QueryErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!q.data) return <PageSkeleton variant="table" />;
  return (
    <DataTable
      title="Các lần nộp kết quả"
      pagination={{
        ...q.data.pagination,
        onPage: (p) => f.set("page", String(p)),
      }}
      actions
      headers={[
        "Lần nộp",
        "Người nộp",
        "Thời điểm",
        "Kết quả xét",
        "Hành động",
      ]}
      rows={q.data.items.map((s) => [
        `Lần ${s.sequence}`,
        s.submitter.displayName,
        dateTime(s.submittedAt),
        <Badge key="state" value={s.status} />,
        <DetailLink
          key="detail"
          href={`/tasks/${taskId}/submissions/${s.id}`}
          label={`Xem lần nộp ${s.sequence}`}
        />,
      ])}
    />
  );
}
