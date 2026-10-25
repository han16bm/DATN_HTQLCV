"use client";
import {
  Badge,
  ButtonLink,
  DataTable,
  DetailLink,
  PageHeader,
} from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
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
      {query.isPending && <PageSkeleton variant="table" />}
      {query.isError && (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      )}{" "}
      {query.data && !query.isError && (
        <DataTable
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filters.set("page", String(p)),
          }}
          actions
          headers={[
            "Dự án",
            "Đơn vị",
            "Người phụ trách",
            "Trạng thái",
            "Ngày bắt đầu",
            "Hạn hoàn thành",
            "Hành động",
          ]}
          rows={query.data.items.map((p) => [
            <div key="project" className="project-summary">
              <div className="project-name">
                <strong>{p.name}</strong>
                <span className="small muted">{p.code}</span>
              </div>
              <p className="project-objective small muted" title={p.objective}>
                {p.objective}
              </p>
            </div>,
            p.unit.name,
            <UserBadge key="owner" name={p.owner.displayName} />,
            <Badge key="status" value={p.status} />,
            p.startDate.split("-").reverse().join("/"),
            dateTime(p.dueAt),
            <DetailLink
              key="detail"
              href={`/projects/${p.id}`}
              label={`Xem dự án ${p.name}`}
            />,
          ])}
        />
      )}
    </>
  );
}
