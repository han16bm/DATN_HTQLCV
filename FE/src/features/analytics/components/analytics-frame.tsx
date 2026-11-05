"use client";

import { FilterField } from "@/components/patterns/filter-bar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page";
import { Select } from "@/components/ui/select";
import {
  prioritySchema,
  taskStatusSchema,
} from "@/features/tasks/schemas/task.schema";
import { label } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import * as Popover from "@radix-ui/react-popover";
import { X } from "lucide-react";
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
  const filterCount = Object.keys(scope.query).filter(
    (key) => key !== "from" && key !== "to",
  ).length;
  return (
    <>
      <PageHeader
        title={title}
        description={
          scope.parsed.success &&
          `${scope.query.from.split("-").reverse().join("/")} – ${scope.query.to.split("-").reverse().join("/")}`
        }
        actions={
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button aria-label="Bộ lọc">
                Bộ lọc{" "}
                {filterCount > 0 && (
                  <span
                    className="rounded-full bg-action px-1.5 text-xs font-semibold text-surface"
                    aria-hidden="true"
                  >
                    {filterCount}
                  </span>
                )}
              </Button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="@container/analytics-filter z-70 w-[min(26.25rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-3.5 shadow-overlay"
                align="end"
                sideOffset={8}
                collisionPadding={16}
                aria-label="Bộ lọc phân tích"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="m-0 text-heading-sm font-semibold text-fg">
                    Bộ lọc
                  </h2>
                  <Popover.Close asChild>
                    <IconButton label="Đóng bộ lọc">
                      <X className="size-4" aria-hidden="true" />
                    </IconButton>
                  </Popover.Close>
                </div>
                <div className="grid gap-3 @min-[22rem]/analytics-filter:grid-cols-2">
                  <LookupFilter kind="UNIT" name="unitId" label="Đơn vị" />
                  <LookupFilter kind="PROJECT" name="projectId" label="Dự án" />
                  <FilterField label="Từ ngày">
                    <Input
                      type="date"
                      value={scope.query.from}
                      onChange={(e) => f.set("from", e.target.value)}
                    />
                  </FilterField>
                  <FilterField label="Đến ngày">
                    <Input
                      type="date"
                      value={scope.query.to}
                      onChange={(e) => f.set("to", e.target.value)}
                    />
                  </FilterField>
                </div>
                <details className="mt-3 border-t border-line pt-2">
                  <summary className="cursor-pointer py-1 text-sm font-medium text-selected-fg">
                    Bộ lọc khác
                  </summary>
                  <div className="mt-2" />
                  <div className="grid gap-3 @min-[22rem]/analytics-filter:grid-cols-2">
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
                      <FilterField key={field.name} label={field.title}>
                        <Select
                          value={f.get(field.name)}
                          onChange={(e) => f.set(field.name, e.target.value)}
                        >
                          <option value="">Tất cả</option>
                          {field.values.map((v) => (
                            <option key={v} value={v}>
                              {label(v)}
                            </option>
                          ))}
                        </Select>
                      </FilterField>
                    ))}
                  </div>
                </details>
                <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3">
                  <Button
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
                  </Button>
                  <Popover.Close asChild>
                    <Button variant="primary">Xong</Button>
                  </Popover.Close>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        }
      />
      {!scope.parsed.success ? (
        <Notice tone="danger">
          Bộ lọc không hợp lệ. Kiểm tra lại ngày và phạm vi đã chọn.
        </Notice>
      ) : (
        children
      )}
    </>
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
    teamId: name === "assigneeId" ? f.get("teamId") || undefined : undefined,
    pageSize: 100,
  });
  return (
    <FilterField label={caption}>
      <Select
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
      </Select>
      {query.isError && (
        <span className="text-sm text-danger-fg">Không tải được lựa chọn.</span>
      )}
    </FilterField>
  );
}
