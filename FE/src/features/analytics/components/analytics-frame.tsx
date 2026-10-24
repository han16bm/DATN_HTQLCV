"use client";
import { PageHeader, PermissionGate, Tabs } from "@/components/ui/page";
import {
  prioritySchema,
  taskStatusSchema,
} from "@/features/tasks/schemas/task.schema";
import { label } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useListAnalyticsFilterOptionsQuery } from "../hooks/use-analytics-queries";
import type { useAnalyticsScope } from "../hooks/use-analytics-scope";

export function AnalyticsFrame({
  title,
  children,
  scope,
}: {
  title: string;
  children: ReactNode;
  scope: ReturnType<typeof useAnalyticsScope>;
}) {
  const f = useUrlFilters();
  const path = usePathname();
  return (
    <PermissionGate permission="ANALYTICS_VIEW">
      <PageHeader
        title={title}
        description="Theo dõi số liệu và căn cứ trong phạm vi được cấp quyền."
      />
      <Tabs
        active={path}
        items={[
          ["/dashboard", "Tổng quan"],
          ["/analytics/risks", "Nguy cơ trễ hạn"],
          ["/analytics/workload", "Khối lượng"],
          ["/analytics/bottlenecks", "Điểm nghẽn"],
          ["/analytics/summary", "Tổng hợp"],
        ].map(([href, label]) => ({
          href: href + scope.suffix,
          label,
          key: href,
        }))}
      />
      <section className="panel filters">
        <LookupFilter kind="UNIT" name="unitId" label="Đơn vị" />
        <LookupFilter kind="PROJECT" name="projectId" label="Dự án" />
        <label>
          Từ ngày
          <input
            type="date"
            value={scope.query.from}
            onChange={(e) => f.set("from", e.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={scope.query.to}
            onChange={(e) => f.set("to", e.target.value)}
          />
        </label>
        <details className="wide advanced-filters">
          <summary>Bộ lọc nâng cao</summary>
          <div className="filters">
            <LookupFilter kind="TEAM" name="teamId" label="Nhóm" />
            <LookupFilter
              kind="PERSON"
              name="ownerId"
              label="Phụ trách dự án"
            />
            <LookupFilter kind="PERSON" name="assigneeId" label="Nhân viên" />
            {[
              {
                name: "status",
                title: "Trạng thái",
                values: taskStatusSchema.options,
              },
              {
                name: "priority",
                title: "Ưu tiên",
                values: prioritySchema.options,
              },
            ].map((field) => (
              <label key={field.name}>
                {field.title}
                <select
                  value={f.get(field.name)}
                  onChange={(e) => f.set(field.name, e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {field.values.map((v) => (
                    <option key={v} value={v}>
                      {label(v)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </details>
      </section>
      {!scope.parsed.success ? (
        <p className="notice error">
          Bộ lọc không hợp lệ. Kiểm tra lại ngày và phạm vi đã chọn.
        </p>
      ) : (
        children
      )}
    </PermissionGate>
  );
}
function LookupFilter({
  kind,
  name,
  label: caption,
}: {
  kind: "UNIT" | "PROJECT" | "TEAM" | "PERSON";
  name: string;
  label: string;
}) {
  const f = useUrlFilters();
  const query = useListAnalyticsFilterOptionsQuery({
    kind,
    unitId: kind !== "UNIT" ? f.get("unitId") || undefined : undefined,
    projectId: ["PERSON", "TEAM"].includes(kind)
      ? f.get("projectId") || undefined
      : undefined,
    teamId: kind === "PERSON" ? f.get("teamId") || undefined : undefined,
    pageSize: 100,
  });
  return (
    <label>
      {caption}
      <select
        aria-label={caption}
        value={f.get(name)}
        onChange={(e) => {
          if (name === "unitId")
            f.setMany({
              unitId: e.target.value,
              projectId: "",
              teamId: "",
              ownerId: "",
              assigneeId: "",
            });
          else if (name === "projectId")
            f.setMany({
              projectId: e.target.value,
              teamId: "",
              ownerId: "",
              assigneeId: "",
            });
          else if (name === "teamId")
            f.setMany({ teamId: e.target.value, assigneeId: "" });
          else f.set(name, e.target.value);
        }}
      >
        <option value="">
          {query.isPending ? "Đang tải…" : "Tất cả trong quyền"}
        </option>
        {query.data?.items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
      {query.isError && (
        <span className="field-error">Không tải được lựa chọn.</span>
      )}
    </label>
  );
}
