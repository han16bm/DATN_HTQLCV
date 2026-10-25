"use client";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { HistoryTable } from "@/components/ui/history-table";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListTaskHistoryQuery } from "../hooks/use-tasks-queries";

export function TaskHistoryPage({ taskId }: { taskId: string }) {
  const filters = useUrlFilters();
  const query = useListTaskHistoryQuery(taskId, { page: filters.page });
  return query.isError ? (
    <QueryErrorState error={query.error} retry={() => void query.refetch()} />
  ) : !query.data ? (
    <PageSkeleton variant="table" />
  ) : (
    <HistoryTable
      title="Lịch sử công việc"
      pagination={{
        ...query.data.pagination,
        onPage: (p) => filters.set("page", String(p)),
      }}
      items={query.data.items}
    />
  );
}
