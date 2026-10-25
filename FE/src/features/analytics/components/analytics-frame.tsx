"use client";
import { PermissionGate } from "@/components/layout/permission-gate";
import { PageHeader, SectionSelect } from "@/components/ui/page";
import * as Popover from "@radix-ui/react-popover";
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
      <PageHeader title={title} />
      <div className="section-toolbar">
        <SectionSelect
          label="Mục phân tích"
          active={path}
          suffix={scope.suffix}
          items={[
            { href: "/dashboard", label: "Tổng quan" },
            { href: "/analytics/risks", label: "Nguy cơ trễ hạn" },
            { href: "/analytics/workload", label: "Khối lượng" },
            { href: "/analytics/bottlenecks", label: "Điểm nghẽn" },
            { href: "/analytics/summary", label: "Tổng hợp" },
          ]}
        />
        <Popover.Root>
          <Popover.Trigger asChild>
            <button type="button">Bộ lọc</button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="analytics-filter-popover"
              align="end"
              sideOffset={8}
              collisionPadding={16}
              aria-label="Bộ lọc phân tích"
            >
              <div className="analytics-filter-heading">
                <h2>Bộ lọc</h2>
                <Popover.Close aria-label="Đóng bộ lọc">×</Popover.Close>
              </div>
              <div className="analytics-filter-fields">
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
              </div>
              <details className="analytics-more-filters">
                <summary>Bộ lọc khác</summary>
                <div className="analytics-filter-fields">
                  <LookupFilter kind="TEAM" name="teamId" label="Nhóm" />
                  <LookupFilter
                    kind="PERSON"
                    name="ownerId"
                    label="Phụ trách dự án"
                  />
                  <LookupFilter
                    kind="PERSON"
                    name="assigneeId"
                    label="Nhân viên"
                  />
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
              <div className="analytics-filter-actions">
                <button
                  type="button"
                  onClick={() =>
                    f.setMany({
                      unitId: "",
                      projectId: "",
                      teamId: "",
                      ownerId: "",
                      assigneeId: "",
                      status: "",
                      priority: "",
                      from: "",
                      to: "",
                    })
                  }
                >
                  Đặt lại
                </button>
                <Popover.Close asChild>
                  <button type="button" className="primary">
                    Xong
                  </button>
                </Popover.Close>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
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
        <option value="">{query.isPending ? "Đang tải…" : "Tất cả"}</option>
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
