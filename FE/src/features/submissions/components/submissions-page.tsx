"use client";
import {
  Badge,
  DataTable,
  Loading,
  Pagination,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import Link from "next/link";
import { useListSubmissionsQuery } from "../hooks/use-submissions-queries";
export function SubmissionsPage({ taskId }: { taskId: string }) {
  const f = useUrlFilters();
  const q = useListSubmissionsQuery(taskId, { page: f.page });
  if (q.isError)
    return <QueryErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!q.data) return <Loading />;
  return (
    <Panel title="Các lần nộp kết quả">
      <DataTable
        headers={["Lần nộp", "Người nộp", "Thời điểm", "Kết quả xét"]}
        rows={q.data.items.map((s) => [
          <Link
            key={s.id}
            className="text-link"
            href={`/tasks/${taskId}/submissions/${s.id}`}
          >
            Lần {s.sequence}
          </Link>,
          s.submitter.displayName,
          dateTime(s.submittedAt),
          <Badge key="state" value={s.status} />,
        ])}
      />
      <Pagination
        {...q.data.pagination}
        onPage={(p) => f.set("page", String(p))}
      />
    </Panel>
  );
}
