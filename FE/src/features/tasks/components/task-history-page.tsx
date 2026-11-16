"use client";

import { HistoryTable } from "@/components/ui/history-table";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListTaskHistoryQuery } from "../hooks/use-tasks-queries";

export function TaskHistoryTable({
  taskId,
  page,
  onPage,
}: {
  taskId: string;
  page: number;
  onPage: (page: number) => void;
}) {
  const query = useListTaskHistoryQuery(taskId, { page });
  return query.isError ? (
    <QueryErrorState error={query.error} retry={query.refetch} />
  ) : !query.data ? (
    <PageSkeleton variant="table" />
  ) : (
    <HistoryTable
      loading={query.isFetching}
      title="Lịch sử công việc"
      pagination={{ ...query.data.pagination, onPage }}
      items={query.data.items}
    />
  );
}

export function TaskHistoryPage({ taskId }: { taskId: string }) {
  const filters = useUrlFilters();
  return (
    <TaskHistoryTable
      taskId={taskId}
      page={filters.page}
      onPage={(p) => filters.set("page", String(p))}
    />
  );
}
