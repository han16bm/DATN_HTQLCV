"use client";

import { FilterBar, FilterField } from "@/components/patterns/filter-bar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HeaderActions } from "@/components/ui/header-actions";
import { SearchInput } from "@/components/ui/input";
import { PageSkeleton, Spinner } from "@/components/ui/loading";
import { StatusLozenge } from "@/components/ui/lozenge";
import { DetailLink, PageHeader } from "@/components/ui/page";
import { UserBadge } from "@/components/ui/user-badge";
import { DataTable } from "@/components/patterns/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Priority } from "@/components/ui/priority";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, label } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { Columns3, List } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useListTasksQuery } from "../hooks/use-tasks-queries";
import { prioritySchema, taskStatusSchema } from "../schemas/task.schema";
import { CreateTaskAction } from "./create-task-action";

export function TaskListPage({
  projectId: fixedProjectId,
}: {
  projectId?: string;
}) {
  const { session } = useSession();
  const filters = useUrlFilters();
  const search = useSearchParams();
  const router = useRouter();
  const status = taskStatusSchema.safeParse(filters.get("status"));
  const priority = prioritySchema.safeParse(filters.get("priority"));
  const projectId = fixedProjectId ?? filters.get("projectId");
  const projects = useListProjectsQuery(
    { pageSize: 100 },
    { enabled: !fixedProjectId },
  );
  const members = useListProjectMembersQuery(projectId, { pageSize: 100 });
  const query = useListTasksQuery({
    q: filters.get("q") || undefined,
    projectId: projectId || undefined,
    status: status.success ? status.data : undefined,
    priority: priority.success ? priority.data : undefined,
    assigneeId: filters.get("assigneeId") || undefined,
    overdue: filters.get("overdue") === "true" ? true : undefined,
    page: filters.page,
    pageSize: 20,
  });
  const board = filters.get("view") === "board";
  const filtered = [
    "q",
    "status",
    "overdue",
    "priority",
    "assigneeId",
    ...(fixedProjectId ? [] : ["projectId"]),
  ].some((key) => filters.get(key));
  const data = query.data;
  const clearFilters = () =>
    filters.setMany({
      q: "",
      status: "",
      overdue: "",
      priority: "",
      assigneeId: "",
      ...(fixedProjectId ? {} : { projectId: "" }),
    });
  const setView = (view: string) => {
    const next = new URLSearchParams(search);
    if (view) next.set("view", view);
    else next.delete("view");
    router.replace(`?${next}${window.location.hash}`, { scroll: false });
  };
  const create = <CreateTaskAction projectId={projectId || undefined} />;
  return (
    <>
      {!fixedProjectId && <PageHeader title="Công việc" actions={create} />}
      {fixedProjectId && <HeaderActions>{create}</HeaderActions>}
      <FilterBar
        label="Bộ lọc công việc"
        tools={
          <>
            {filtered && (
              <Button variant="subtle" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            )}
            <SegmentedControl
              label="Chế độ xem"
              value={board ? "board" : ""}
              onChange={setView}
              options={[
                { value: "", label: "Danh sách", icon: List },
                { value: "board", label: "Bảng trạng thái", icon: Columns3 },
              ]}
            />
          </>
        }
      >
        <FilterField label="Tìm công việc" search>
          <SearchInput
            placeholder="Nhập tên công việc…"
            value={filters.get("q")}
            onChange={(e) => filters.set("q", e.target.value)}
          />
        </FilterField>
        {!fixedProjectId && (
          <FilterField label="Dự án">
            <Select
              fit
              value={projectId}
              onChange={(e) => {
                filters.setMany({
                  projectId: e.target.value,
                  assigneeId: "",
                });
              }}
            >
              <option value="">Tất cả dự án</option>
              {projects.data?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FilterField>
        )}
        <FilterField label="Trạng thái">
          <Select
            fit
            value={
              filters.get("overdue") === "true"
                ? "OVERDUE"
                : filters.get("status")
            }
            onChange={(e) =>
              filters.setMany({
                status: e.target.value === "OVERDUE" ? "" : e.target.value,
                overdue: e.target.value === "OVERDUE" ? "true" : "",
              })
            }
          >
            <option value="">Tất cả</option>
            <option value="OVERDUE">Quá hạn</option>
            {taskStatusSchema.options.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </Select>
        </FilterField>
        {projectId && (
          <FilterField label="Người thực hiện">
            <Select
              fit
              value={filters.get("assigneeId")}
              onChange={(e) => filters.set("assigneeId", e.target.value)}
            >
              <option value="">Tất cả</option>
              {members.data?.items.map((m) => (
                <option key={m.id} value={m.userId}>
                  {m.user.displayName}
                </option>
              ))}
            </Select>
          </FilterField>
        )}
        <FilterField label="Ưu tiên">
          <Select
            fit
            value={filters.get("priority")}
            onChange={(e) => filters.set("priority", e.target.value)}
          >
            <option value="">Tất cả</option>
            {prioritySchema.options.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </Select>
        </FilterField>
        {session && session.user.systemRole !== "EMPLOYEE" && (
          <Button
            selected={filters.get("assigneeId") === session.user.id}
            onClick={() =>
              filters.set(
                "assigneeId",
                filters.get("assigneeId") === session.user.id
                  ? ""
                  : session.user.id,
              )
            }
          >
            Việc của tôi
          </Button>
        )}
      </FilterBar>
      {!fixedProjectId && projects.isError && (
        <QueryErrorState error={projects.error} retry={projects.refetch} />
      )}
      {members.isError && (
        <QueryErrorState error={members.error} retry={members.refetch} />
      )}
      {query.isError && (
        <QueryErrorState error={query.error} retry={query.refetch} />
      )}
      {query.isPending && <PageSkeleton variant="table" />}
      {data && !query.isError && (
        <div className="mb-4">
          {board ? (
            <div className="relative" aria-busy={query.isFetching || undefined}>
              {query.isFetching && (
                <div
                  role="status"
                  aria-label="Đang cập nhật bảng trạng thái"
                  className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-surface/60"
                >
                  <Spinner />
                </div>
              )}
              <div
                className="flex items-start gap-2.5 overflow-x-auto overscroll-x-contain pb-2"
                tabIndex={0}
                role="region"
                aria-label="Bảng trạng thái công việc"
              >
                {taskStatusSchema.options.map((s) => {
                  const items = data.items.filter((t) => t.status === s);
                  return (
                    <section
                      key={s}
                      className="w-[216px] shrink-0 rounded-lg bg-sunken p-2"
                      data-status={s}
                      aria-label={label(s)}
                    >
                      <h2 className="m-0 mb-2 flex items-center gap-1.5 px-1 text-sm font-semibold text-fg-subtle">
                        {label(s)}
                        <span className="rounded-full bg-line px-1.5 text-xs font-medium text-fg-subtle">
                          {items.length}
                        </span>
                      </h2>
                      {items.map((t) => (
                        <Link
                          key={t.id}
                          className="mb-2 grid gap-2 rounded-md border border-line bg-surface p-3 last:mb-0 hover:border-line-input"
                          href={`/tasks/${t.id}`}
                        >
                          <span
                            className="line-clamp-2 text-sm leading-snug font-medium text-fg"
                            title={t.title}
                          >
                            {t.title}
                          </span>
                          {!fixedProjectId && (
                            <span className="text-xs text-fg-subtle">
                              {t.project.name}
                            </span>
                          )}
                          <span className="flex items-center justify-between gap-2">
                            <span className="grid gap-0.5 text-xs">
                              <Priority value={t.priority} />
                              <span
                                className={
                                  t.isOverdue
                                    ? "font-medium text-danger-fg"
                                    : "text-fg-subtle"
                                }
                              >
                                {dateTime(t.dueAt)}
                              </span>
                            </span>
                            {t.assignee ? (
                              <Avatar name={t.assignee.displayName} />
                            ) : (
                              <span className="text-xs text-fg-subtle">
                                Chưa giao
                              </span>
                            )}
                          </span>
                        </Link>
                      ))}
                    </section>
                  );
                })}
              </div>
            </div>
          ) : (
            <DataTable
              fit={Boolean(fixedProjectId)}
              loading={query.isFetching}
              filtered={filtered}
              onClearFilters={clearFilters}
              pagination={{
                ...data.pagination,
                onPage: (p) => filters.set("page", String(p)),
              }}
              actions
              widths={
                fixedProjectId
                  ? [21, 16, 11, 17, 12, 12, 11]
                  : [21, 12, 14, 10, 13, 11, 11, 8]
              }
              headers={[
                "Công việc",
                ...(fixedProjectId ? [] : ["Dự án"]),
                "Người thực hiện",
                "Ưu tiên",
                "Trạng thái",
                "Ngày bắt đầu",
                "Hạn hoàn thành",
                "Hành động",
              ]}
              rows={data.items.map((t) => [
                <Link
                  key="title"
                  className="block max-w-[30ch] truncate font-medium text-fg hover:text-selected-fg hover:underline"
                  title={t.title}
                  href={`/tasks/${t.id}`}
                >
                  {t.title}
                </Link>,
                ...(fixedProjectId ? [] : [t.project.name]),
                t.assignee ? (
                  <UserBadge key="assignee" name={t.assignee.displayName} />
                ) : (
                  "Chưa phân công"
                ),
                <span key="priority" className={fixedProjectId ? "text-xs [&>span]:whitespace-normal" : undefined}>
                  <Priority value={t.priority} />
                </span>,
                <span key="state" className="flex flex-wrap items-center gap-1 [&>span]:whitespace-normal">
                  <StatusLozenge value={t.status} />
                  {t.isOverdue && <StatusLozenge value="OVERDUE" />}
                </span>,
                <span key="start" className={fixedProjectId ? "text-xs tabular-nums" : undefined}>
                  {t.firstStartedAt ? dateTime(t.firstStartedAt) : "Chưa bắt đầu"}
                </span>,
                <span key="due" className={fixedProjectId ? "text-xs tabular-nums" : undefined}>
                  {dateTime(t.dueAt)}
                </span>,
                <DetailLink
                  key="detail"
                  href={`/tasks/${t.id}`}
                  label={`Xem công việc ${t.title}`}
                />,
              ])}
            />
          )}
          {board && !data.items.length && (
            <EmptyState
              title={filtered ? "Không có kết quả phù hợp" : undefined}
              message={
                filtered
                  ? "Hãy thử đổi hoặc xóa bộ lọc."
                  : "Chưa có công việc nào để hiển thị."
              }
              action={
                filtered ? (
                  <Button onClick={clearFilters}>Xóa bộ lọc</Button>
                ) : undefined
              }
            />
          )}
          {board && (
            <Pagination
              {...data.pagination}
              onPage={(p) => filters.set("page", String(p))}
            />
          )}
        </div>
      )}
    </>
  );
}
