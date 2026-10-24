"use client";
import { DataTable, Loading, Pagination, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListTaskHistoryQuery } from "../hooks/use-tasks-queries";

export function TaskHistoryPage({ taskId }: { taskId: string }) {
  const filters = useUrlFilters();
  const query = useListTaskHistoryQuery(taskId, { page: filters.page });
  return (
    <Panel title="Lịch sử công việc">
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <Loading />
      ) : (
        <>
          <DataTable
            headers={["Thời điểm", "Người thực hiện", "Sự kiện", "Thay đổi"]}
            rows={query.data.items.map((a) => [
              dateTime(a.at),
              a.actorId,
              <div key="action">
                {a.action}
                {a.reason && <p className="small muted">{a.reason}</p>}
              </div>,
              <details key="changes">
                <summary>Xem trước / sau</summary>
                <pre className="comparison">
                  {JSON.stringify(
                    { before: a.before, after: a.after },
                    null,
                    2,
                  )}
                </pre>
              </details>,
            ])}
          />
          <Pagination
            {...query.data.pagination}
            onPage={(p) => filters.set("page", String(p))}
          />
        </>
      )}
    </Panel>
  );
}
