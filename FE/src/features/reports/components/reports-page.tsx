"use client";
import { FilterBar, FilterField } from "@/components/patterns/filter-bar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hasPermission } from "@/lib/auth/access";

import { PageSkeleton } from "@/components/ui/loading";
import { ButtonLink, DetailLink, PageHeader } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { DataTable } from "@/components/patterns/data-table";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { hours, label, options } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { z } from "zod";
import { useListReportsQuery } from "../hooks/use-reports-queries";
import { periodTypeSchema } from "../schemas/reports.schema";
export function ReportsPage() {
  const f = useUrlFilters();
  const { session } = useSession();
  const projectId = f.get("projectId");
  const filterAuthors = Boolean(
    projectId && hasPermission(session, "ANALYTICS_VIEW", projectId),
  );
  const projects = useListProjectsQuery({ pageSize: 100 });
  const members = useListProjectMembersQuery(
    projectId,
    {
      pageSize: 100,
    },
    { enabled: filterAuthors },
  );
  const period = periodTypeSchema.safeParse(f.get("periodType"));
  const status = z.enum(["DRAFT", "SUBMITTED"]).safeParse(f.get("status"));
  const q = useListReportsQuery({
    projectId: f.get("projectId") || undefined,
    authorId: f.get("authorId") || undefined,
    periodType: period.success ? period.data : undefined,
    status: status.success ? status.data : undefined,
    from: f.get("from") || undefined,
    to: f.get("to") || undefined,
    page: f.page,
  });
  return (
    <>
      <PageHeader
        title="Báo cáo công việc"
        actions={
          <ButtonLink href="/reports/new" primary>
            Lập báo cáo
          </ButtonLink>
        }
      />
      <FilterBar label="Bộ lọc báo cáo">
        <FilterField label="Dự án">
          <Select
            fit
            value={f.get("projectId")}
            onChange={(e) =>
              f.setMany({ projectId: e.target.value, authorId: "" })
            }
          >
            <option value="">Tất cả</option>
            {projects.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Loại kỳ">
          <Select
            fit
            value={f.get("periodType")}
            onChange={(e) => f.set("periodType", e.target.value)}
          >
            <option value="">Tất cả</option>
            {options(periodTypeSchema.options).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Trạng thái">
          <Select
            fit
            value={f.get("status")}
            onChange={(e) => f.set("status", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="DRAFT">Nháp của tôi</option>
            <option value="SUBMITTED">Đã gửi</option>
          </Select>
        </FilterField>
        {filterAuthors && (
          <FilterField label="Người lập">
            <Select
              fit
              value={f.get("authorId")}
              onChange={(e) => f.set("authorId", e.target.value)}
            >
              <option value="">Tất cả người lập</option>
              {members.data?.items.map((m) => (
                <option key={m.id} value={m.userId}>
                  {m.user.displayName}
                </option>
              ))}
            </Select>
          </FilterField>
        )}
        <FilterField label="Từ ngày">
          <Input
            type="date"
            value={f.get("from")}
            onChange={(e) => f.set("from", e.target.value)}
          />
        </FilterField>
        <FilterField label="Đến ngày">
          <Input
            type="date"
            value={f.get("to")}
            onChange={(e) => f.set("to", e.target.value)}
          />
        </FilterField>
      </FilterBar>
      {projects.isError && (
        <QueryErrorState error={projects.error} retry={projects.refetch} />
      )}
      {filterAuthors && members.isError && (
        <QueryErrorState error={members.error} retry={members.refetch} />
      )}
      {q.isError ? (
        <QueryErrorState error={q.error} retry={q.refetch} />
      ) : !q.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          loading={q.isFetching}
          pagination={{
            ...q.data.pagination,
            onPage: (p) => f.set("page", String(p)),
          }}
          actions
          widths={[21, 25, 20, 10, 14, 10]}
          headers={[
            "Báo cáo",
            "Dự án",
            "Người lập",
            "Giờ công",
            "Trạng thái",
            "Hành động",
          ]}
          rows={q.data.items.map((r) => [
            `${label(r.periodType)} · ${r.periodStart}`,
            r.project.name,
            <UserBadge key="author" name={r.author.displayName} />,
            r.totalMinutes !== null ? hours(r.totalMinutes) : "Chưa chốt",
            <StatusLozenge key="status" value={r.status} />,
            <DetailLink
              key="detail"
              href={`/reports/${r.id}${r.status === "DRAFT" ? "/edit" : ""}`}
              label={`Xem báo cáo ${r.periodStart}`}
            />,
          ])}
        />
      )}
    </>
  );
}
