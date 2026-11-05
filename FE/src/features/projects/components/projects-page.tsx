"use client";
import { FilterBar, FilterField } from "@/components/patterns/filter-bar";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { canVisit } from "@/lib/auth/access";

import { PageSkeleton } from "@/components/ui/loading";
import { ButtonLink, DetailLink, PageHeader } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { DataTable } from "@/components/patterns/data-table";
import { ProjectTile } from "@/components/ui/project-tile";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useSession } from "@/lib/auth/session-context";
import Link from "next/link";
import { dateTime, label } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListProjectsQuery } from "../hooks/use-projects-queries";
import { projectStatusSchema } from "../schemas/projects.schema";

export function ProjectsPage() {
  const { session } = useSession();
  const filters = useUrlFilters();
  const status = projectStatusSchema.safeParse(filters.get("status"));
  const scope = useListProjectsQuery({ pageSize: 100 });
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
          canVisit(session, "/projects/new") && (
            <ButtonLink href="/projects/new" primary>
              Tạo dự án
            </ButtonLink>
          )
        }
      />
      <FilterBar label="Bộ lọc dự án">
        <FilterField label="Tìm dự án" search>
          <SearchInput
            value={filters.get("q")}
            onChange={(e) => filters.set("q", e.target.value)}
            placeholder="Tìm theo tên hoặc mã dự án"
          />
        </FilterField>
        <FilterField label="Trạng thái">
          <Select
            fit
            value={filters.get("status")}
            onChange={(e) => filters.set("status", e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {projectStatusSchema.options.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Đơn vị">
          <Select
            fit
            value={filters.get("unitId")}
            onChange={(e) => filters.set("unitId", e.target.value)}
          >
            <option value="">Tất cả đơn vị</option>
            {scope.data &&
              [
                ...new Map(
                  scope.data.items.map((p) => [p.unit.id, p.unit]),
                ).values(),
              ].map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </Select>
        </FilterField>
      </FilterBar>
      {scope.isError && (
        <QueryErrorState error={scope.error} retry={scope.refetch} />
      )}
      {query.isPending && <PageSkeleton variant="table" />}
      {query.isError && (
        <QueryErrorState error={query.error} retry={query.refetch} />
      )}{" "}
      {query.data && !query.isError && (
        <DataTable
          loading={query.isFetching}
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filters.set("page", String(p)),
          }}
          actions
          widths={[26, 14, 16, 11, 10, 14, 9]}
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
            <div key="project" className="flex min-w-0 items-center gap-2.5">
              <ProjectTile id={p.id} small />
              <Link
                className="font-medium text-fg hover:text-selected-fg hover:underline"
                href={`/projects/${p.id}`}
              >
                {p.name}
              </Link>
            </div>,
            p.unit.name,
            <UserBadge key="owner" name={p.owner.displayName} />,
            <StatusLozenge key="status" value={p.status} />,
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
