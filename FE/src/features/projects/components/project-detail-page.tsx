"use client";
import {
  Badge,
  ButtonLink,
  DataTable,
  Loading,
  Pagination,
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
  const history = useListProjectHistoryQuery(projectId, { page: filters.page });
  const tasks = useListTasksQuery({ projectId, pageSize: 5 });
  if (project.isError) return <QueryErrorState error={project.error} />;
  if (!project.data) return <Loading />;
  if (search.get("tab") === "history")
    return (
      <Panel title="Lịch sử dự án">
        {history.isError ? (
          <QueryErrorState
            error={history.error}
            retry={() => void history.refetch()}
          />
        ) : !history.data ? (
          <Loading />
        ) : (
          <>
            <DataTable
              headers={[
                "Thời điểm",
                "Người thao tác",
                "Sự kiện",
                "Lý do",
                "Thay đổi",
              ]}
              rows={history.data.items.map((a) => [
                dateTime(a.at),
                a.actorId,
                a.action,
                a.reason ?? "—",
                <details key="change">
                  <summary>Xem trước / sau</summary>
                  <p>Trước: {JSON.stringify(a.before)}</p>
                  <p>Sau: {JSON.stringify(a.after)}</p>
                </details>,
              ])}
            />
            <Pagination
              {...history.data.pagination}
              onPage={(p) => filters.set("page", String(p))}
            />
          </>
        )}
      </Panel>
    );
  const p = project.data;
  return (
    <div className="details-grid">
      <div>
        <Panel title="Mục tiêu dự án">
          <p className="prose">{p.objective}</p>
        </Panel>
        <Panel title="Các mốc triển khai">
          {history.data ? (
            <ul className="timeline">
              {history.data.items.map((a) => (
                <li key={a.id}>
                  {a.action}
                  <div className="small muted">
                    {dateTime(a.at)}
                    {a.reason ? ` · ${a.reason}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : history.isError ? (
            <QueryErrorState error={history.error} />
          ) : (
            <Loading />
          )}
        </Panel>
        <Panel title="Công việc gần đây">
          {tasks.isError ? (
            <QueryErrorState error={tasks.error} />
          ) : tasks.data ? (
            <>
              <DataTable
                headers={["Công việc", "Trạng thái", "Hạn"]}
                rows={tasks.data.items.map((t) => [
                  <ButtonLink key={t.id} href={`/tasks/${t.id}`}>
                    {t.title}
                  </ButtonLink>,
                  <Badge key="status" value={t.status} />,
                  dateTime(t.dueAt),
                ])}
              />
              <p className="small muted">
                {tasks.data.pagination.total} công việc trong phạm vi bạn được
                xem.
              </p>
            </>
          ) : (
            <Loading />
          )}
        </Panel>
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
