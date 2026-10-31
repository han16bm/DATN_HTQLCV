"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Badge, DataTable, DetailLink, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { AnalyticsTabs } from "@/features/analytics/components/analytics-tabs";
import { useListAnalyticsFilterOptionsQuery } from "@/features/analytics/hooks/use-analytics-queries";
import { label, options } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListAlertsQuery } from "../hooks/use-alerts-queries";
import {
  alertSeveritySchema,
  alertStatusSchema,
} from "../schemas/alerts.schema";

export function AlertsPage() {
  const f = useUrlFilters();
  const status = alertStatusSchema.safeParse(f.get("status"));
  const level = alertSeveritySchema.safeParse(f.get("severity"));
  const projects = useListAnalyticsFilterOptionsQuery({
    kind: "PROJECT",
    pageSize: 100,
  });
  const q = useListAlertsQuery({
    projectId: f.get("projectId") || undefined,
    status: status.success ? status.data : undefined,
    severity: level.success ? level.data : undefined,
    page: f.page,
  });
  return (
    <>
      <PageHeader title="Cảnh báo" navigation={<AnalyticsTabs />} />
      <section className="panel filters">
        <label>
          Dự án
          <select
            value={f.get("projectId")}
            onChange={(e) => f.set("projectId", e.target.value)}
          >
            <option value="">Tất cả dự án</option>
            {projects.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {[
          {
            name: "status",
            title: "Trạng thái xử lý",
            values: alertStatusSchema.options,
          },
          {
            name: "severity",
            title: "Mức độ",
            values: alertSeveritySchema.options,
          },
        ].map((config) => (
          <label key={config.name}>
            {config.title}
            <select
              value={f.get(config.name)}
              onChange={(e) => f.set(config.name, e.target.value)}
            >
              <option value="">Tất cả</option>
              {options(config.values).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>
      {projects.isError && (
        <QueryErrorState error={projects.error} retry={projects.refetch} />
      )}
      {q.isError ? (
        <QueryErrorState error={q.error} retry={q.refetch} />
      ) : !q.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          pagination={{
            ...q.data.pagination,
            onPage: (p) => f.set("page", String(p)),
          }}
          actions
          widths={[22, 22, 10, 14, 21, 11]}
          headers={[
            "Vấn đề",
            "Đối tượng",
            "Mức độ",
            "Tình trạng xử lý",
            "Điều kiện nguồn",
            "Hành động",
          ]}
          rows={q.data.items.map((a) => [
            label(a.type),
            <span
              key="target"
              className="task-name"
              title={a.taskTitle ?? undefined}
            >
              {a.taskTitle ?? "Dự án"}
            </span>,
            <Badge key="severity" value={a.severity} />,
            <Badge key="status" value={a.status} />,
            a.conditionActive ? "Còn điều kiện phát sinh" : "Điều kiện đã hết",
            <DetailLink
              key="detail"
              href={`/alerts/${a.id}`}
              label={`Xem cảnh báo ${label(a.type)}`}
            />,
          ])}
        />
      )}
    </>
  );
}
