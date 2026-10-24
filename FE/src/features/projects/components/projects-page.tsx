"use client";
import {
  Badge,
  ButtonLink,
  Empty,
  Loading,
  PageHeader,
  Pagination,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { projectStatusSchema } from "@/features/projects/schemas/projects.schema";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { dateTime, label } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListProjectsQuery } from "../hooks/use-projects-queries";

export function ProjectsPage() {
  const { session } = useSession();
  const filters = useUrlFilters();
  const status = projectStatusSchema.safeParse(filters.get("status"));
  const query = useListProjectsQuery({
    q: filters.get("q") || undefined,
    status: status.success ? status.data : undefined,
    unitId: filters.get("unitId") || undefined,
    page: filters.page,
  });
  return (
    <>
      <PageHeader
        title="Dự án"
        description="Tập trung kế hoạch, thành viên và công việc của nhóm."
        actions={
          hasPermission(session, "PROJECT_CREATE") && (
            <ButtonLink href="/projects/new" primary>
              Tạo dự án
            </ButtonLink>
          )
        }
      />
      <section className="panel filters">
        <label>
          Tìm dự án
          <input
            type="search"
            value={filters.get("q")}
            onChange={(e) => filters.set("q", e.target.value)}
            placeholder="Tìm theo tên hoặc mã dự án"
          />
        </label>
        <label>
          Trạng thái
          <select
            value={filters.get("status")}
            onChange={(e) => filters.set("status", e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {projectStatusSchema.options.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Đơn vị
          <select
            value={filters.get("unitId")}
            onChange={(e) => filters.set("unitId", e.target.value)}
          >
            <option value="">Tất cả trong quyền</option>
            {query.data &&
              [
                ...new Map(
                  query.data.items.map((p) => [p.unit.id, p.unit]),
                ).values(),
              ].map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </label>
      </section>
      {query.isPending && <Loading />}
      {query.isError && (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      )}{" "}
      {query.data && !query.isError && (
        <>
          <div className="project-grid">
            {query.data.items.map((p) => (
              <Panel key={p.id}>
                <Badge value={p.status} />
                <h2 className="section-gap">{p.name}</h2>
                <p className="muted prose">{p.objective}</p>
                <dl className="section-gap">
                  <div>
                    <dt>Người phụ trách</dt>
                    <dd>{p.owner.displayName}</dd>
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
                <div className="table-footer">
                  <span className="small muted">
                    {p.unit.name} · {p.code}
                  </span>
                  <ButtonLink href={`/projects/${p.id}`}>Mở dự án</ButtonLink>
                </div>
              </Panel>
            ))}
          </div>
          {!query.data.items.length && (
            <Panel>
              <Empty />
            </Panel>
          )}
          <Pagination
            {...query.data.pagination}
            onPage={(p) => filters.set("page", String(p))}
          />
        </>
      )}
    </>
  );
}
