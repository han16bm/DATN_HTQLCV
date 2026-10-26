"use client";

import { HistoryTable } from "@/components/ui/history-table";
import { PageSkeleton } from "@/components/ui/loading";
import {
  Badge,
  ButtonLink,
  DataTable,
  DetailLink,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListTasksQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useSearchParams } from "next/navigation";
import {
  useGetProjectQuery,
  useListProjectHistoryQuery,
} from "../hooks/use-projects-queries";

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const search = useSearchParams();
  const filters = useUrlFilters();
  const project = useGetProjectQuery(projectId);
  const history = useListProjectHistoryQuery(projectId, {
    page: filters.page,
    pageSize: search.get("tab") === "history" ? 20 : 5,
  });
  const tasks = useListTasksQuery({ projectId, pageSize: 5 });
  if (project.isError) return <QueryErrorState error={project.error} />;
  if (!project.data) return <PageSkeleton />;
  if (search.get("tab") === "history")
    return history.isError ? (
      <QueryErrorState
        error={history.error}
        retry={() => void history.refetch()}
      />
    ) : !history.data ? (
      <PageSkeleton variant="table" />
    ) : (
      <HistoryTable
        title="Lịch sử dự án"
        pagination={{
          ...history.data.pagination,
          onPage: (p) => filters.set("page", String(p)),
        }}
        items={history.data.items}
      />
    );
  const p = project.data;
  return (
    <div className="details-grid">
      <div>
        <Panel title="Mục tiêu dự án">
          <p className="prose">{p.objective}</p>
        </Panel>
        {history.isError ? (
          <QueryErrorState
            error={history.error}
            retry={() => void history.refetch()}
          />
        ) : !history.data ? (
          <PageSkeleton variant="table" />
        ) : (
          <HistoryTable
            title="Các mốc triển khai"
            items={history.data.items}
            pagination={{ total: history.data.pagination.total }}
            headerActions={
              <ButtonLink href={`/projects/${projectId}?tab=history`}>
                Xem toàn bộ lịch sử
              </ButtonLink>
            }
          />
        )}
        {tasks.isError ? (
          <QueryErrorState error={tasks.error} />
        ) : tasks.data ? (
          <DataTable
            title="Công việc gần đây"
            headerActions={
              <ButtonLink href={`/tasks?projectId=${projectId}`}>
                Tất cả công việc
              </ButtonLink>
            }
            pagination={{ total: tasks.data.pagination.total }}
            actions
            headers={["Công việc", "Trạng thái", "Hạn", "Hành động"]}
            rows={tasks.data.items.map((t) => [
              t.title,
              <Badge key="status" value={t.status} />,
              dateTime(t.dueAt),
              <DetailLink
                key="detail"
                href={`/tasks/${t.id}`}
                label={`Xem công việc ${t.title}`}
              />,
            ])}
          />
        ) : (
          <PageSkeleton />
        )}
      </div>
      <div>
        <Panel title="Thông tin kế hoạch">
          <dl>
            <div>
              <dt>Mã dự án</dt>
              <dd>{p.code}</dd>
            </div>
            <div>
              <dt>Người phụ trách</dt>
              <dd>{p.owner.displayName}</dd>
            </div>
            <div>
              <dt>Đơn vị</dt>
              <dd>{p.unit.name}</dd>
            </div>
            <div>
              <dt>Ngày bắt đầu</dt>
              <dd>{p.startDate}</dd>
            </div>
            <div>
              <dt>Hạn hoàn thành</dt>
              <dd>{dateTime(p.dueAt)}</dd>
            </div>
          </dl>
        </Panel>
        <div className="actions">
          <ButtonLink href={`/tasks?projectId=${projectId}`} primary>
            Mở công việc trong dự án
          </ButtonLink>
          <ButtonLink href={`/projects/${projectId}/members`}>
            Thành viên dự án
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
