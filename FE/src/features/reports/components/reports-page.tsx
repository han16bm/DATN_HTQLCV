"use client";
import {
  Badge,
  ButtonLink,
  DataTable,
  Loading,
  PageHeader,
  Pagination,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { periodTypeSchema } from "@/features/reports/schemas/reports.schema";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { hours, label, options } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import Link from "next/link";
import { z } from "zod";
import { useListReportsQuery } from "../hooks/use-reports-queries";
export function ReportsPage() {
  const f = useUrlFilters();
  const projects = useListProjectsQuery({ pageSize: 100 });
  const members = useListProjectMembersQuery(f.get("projectId"), {
    pageSize: 100,
  });
  const { session } = useSession();
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
        description="Báo cáo cá nhân và các bản đã gửi trong phạm vi quản lý."
        actions={
          <ButtonLink href="/reports/new" primary>
            Lập báo cáo
          </ButtonLink>
        }
      />
      <section className="panel filters">
        <label>
          Dự án
          <select
            value={f.get("projectId")}
            onChange={(e) => f.set("projectId", e.target.value)}
          >
            <option value="">Tất cả</option>
            {projects.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Loại kỳ
          <select
            value={f.get("periodType")}
            onChange={(e) => f.set("periodType", e.target.value)}
          >
            <option value="">Tất cả</option>
            {options(periodTypeSchema.options).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select
            value={f.get("status")}
            onChange={(e) => f.set("status", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="DRAFT">Nháp của tôi</option>
            <option value="SUBMITTED">Đã gửi</option>
          </select>
        </label>
        {f.get("projectId") &&
          hasPermission(session, "ANALYTICS_VIEW", f.get("projectId")) && (
            <label>
              Người lập
              <select
                value={f.get("authorId")}
                onChange={(e) => f.set("authorId", e.target.value)}
              >
                <option value="">Tất cả trong phạm vi</option>
                {members.data?.items.map((m) => (
                  <option key={m.id} value={m.userId}>
                    {m.user.displayName}
                  </option>
                ))}
              </select>
            </label>
          )}
        <label>
          Từ ngày
          <input
            type="date"
            value={f.get("from")}
            onChange={(e) => f.set("from", e.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={f.get("to")}
            onChange={(e) => f.set("to", e.target.value)}
          />
        </label>
      </section>
      {q.isError ? (
        <QueryErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !q.data ? (
        <Loading />
      ) : (
        <Panel>
          <DataTable
            headers={[
              "Báo cáo",
              "Người lập",
              "Tổng giờ công đã chốt",
              "Trạng thái",
            ]}
            rows={q.data.items.map((r) => [
              <Link
                key={r.id}
                className="text-link"
                href={`/reports/${r.id}${r.status === "DRAFT" ? "/edit" : ""}`}
              >
                {label(r.periodType)} · {r.periodStart}
                <p className="small muted">
                  {projects.data?.items.find((p) => p.id === r.projectId)
                    ?.name ?? r.projectId}
                </p>
              </Link>,
              r.author.displayName,
              r.totalMinutes !== null ? hours(r.totalMinutes) : "Chưa chốt",
              <Badge key="status" value={r.status} />,
            ])}
          />
          <Pagination
            {...q.data.pagination}
            onPage={(p) => f.set("page", String(p))}
          />
        </Panel>
      )}
    </>
  );
}
