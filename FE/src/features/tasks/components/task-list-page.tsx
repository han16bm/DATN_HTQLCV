"use client";
import { hasPermission } from "@/lib/auth/access";

import { Form } from "@/components/forms/form";
import { FormSelect } from "@/components/forms/form-field";
import { Avatar } from "@/components/ui/avatar";
import { HashDialog } from "@/components/ui/dialog";
import { Priority } from "@/components/ui/priority";
import { PageSkeleton } from "@/components/ui/loading";
import { HeaderActions } from "@/components/ui/header-actions";
import {
  Badge,
  DataTable,
  DetailLink,
  Empty,
  PageHeader,
  Pagination,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, label } from "@/lib/format";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useListTasksQuery } from "../hooks/use-tasks-queries";
import { prioritySchema, taskStatusSchema } from "../schemas/task.schema";

export function TaskListPage({
  personal = false,
  projectId: fixedProjectId,
}: {
  personal?: boolean;
  projectId?: string;
}) {
  const { session } = useSession();
  const filters = useUrlFilters();
  const search = useSearchParams();
  const router = useRouter();
  const dialog = useHashDialog();
  const status = taskStatusSchema.safeParse(filters.get("status"));
  const priority = prioritySchema.safeParse(filters.get("priority"));
  const projectId = fixedProjectId ?? filters.get("projectId");
  const projects = useListProjectsQuery({ pageSize: 100 });
  const members = useListProjectMembersQuery(
    projectId,
    { pageSize: 100 },
    { enabled: !personal },
  );
  const query = useListTasksQuery({
    q: filters.get("q") || undefined,
    projectId: projectId || undefined,
    status: status.success ? status.data : undefined,
    priority: priority.success ? priority.data : undefined,
    assigneeId: personal
      ? session?.user.id
      : filters.get("assigneeId") || undefined,
    overdue: filters.get("overdue") === "true" ? true : undefined,
    page: filters.page,
    pageSize: 20,
  });
  const board = filters.get("view") === "board";
  const manageable =
    projects.data?.items.filter(
      (p) =>
        p.status === "ACTIVE" && hasPermission(session, "TASKS_MANAGE", p.id),
    ) ?? [];
  const filtered = [
    "q",
    "status",
    "overdue",
    "priority",
    "assigneeId",
    ...(fixedProjectId ? [] : ["projectId"]),
  ].some((key) => filters.get(key));
  const data = query.data;
  const setView = (view: string) => {
    const next = new URLSearchParams(search);
    if (view) next.set("view", view);
    else next.delete("view");
    router.replace(`?${next}`, { scroll: false });
  };
  const form = useForm({
    resolver: zodResolver(z.object({ projectId: z.string().min(1) }).strict(), {
      error: validationMessage,
    }),
    defaultValues: {},
  });
  const { errors } = form.formState;
  const createButton = manageable.length > 0 && (
    <div className="task-create">
      {personal && <span className="small muted">Dự án bạn quản lý</span>}
      <button
        className="primary"
        onClick={() =>
          projectId && manageable.some((p) => p.id === projectId)
            ? router.push(`/projects/${projectId}/tasks/new`)
            : dialog.open("choose-task-project")
        }
      >
        Tạo công việc
      </button>
    </div>
  );
  const viewButtons = (
    <div className="segmented" role="group" aria-label="Chế độ xem">
      <button type="button" aria-pressed={!board} onClick={() => setView("")}>
        Danh sách
      </button>
      <button
        type="button"
        aria-pressed={board}
        onClick={() => setView("board")}
      >
        Bảng trạng thái
      </button>
    </div>
  );
  return (
    <>
      {!fixedProjectId && (
        <PageHeader
          title={personal ? "Việc của tôi" : "Công việc"}
          level={personal ? 2 : 1}
          actions={createButton}
        />
      )}
      {fixedProjectId && <HeaderActions>{createButton}</HeaderActions>}
      <section className="filters" aria-label="Bộ lọc công việc">
        <label className="filter-search">
          Tìm công việc
          <input
            type="search"
            placeholder="Nhập tên công việc…"
            value={filters.get("q")}
            onChange={(e) => filters.set("q", e.target.value)}
          />
        </label>
        {!fixedProjectId && (
          <label>
            Dự án
            <select
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
            </select>
          </label>
        )}
        <label>
          Trạng thái
          <select
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
          </select>
        </label>
        {!personal && projectId && (
          <label>
            Người thực hiện
            <select
              value={filters.get("assigneeId")}
              onChange={(e) => filters.set("assigneeId", e.target.value)}
            >
              <option value="">Tất cả</option>
              {members.data?.items.map((m) => (
                <option key={m.id} value={m.userId}>
                  {m.user.displayName}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Ưu tiên
          <select
            value={filters.get("priority")}
            onChange={(e) => filters.set("priority", e.target.value)}
          >
            <option value="">Tất cả</option>
            {prioritySchema.options.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </select>
        </label>
        {!personal && (
          <button
            type="button"
            className="filter-chip"
            aria-pressed={filters.get("assigneeId") === session?.user.id}
            onClick={() =>
              filters.set(
                "assigneeId",
                filters.get("assigneeId") === session?.user.id
                  ? ""
                  : (session?.user.id ?? ""),
              )
            }
          >
            Việc của tôi
          </button>
        )}
        {filtered && (
          <div className="filter-tools">
            <button
              type="button"
              className="link-button"
              onClick={() =>
                filters.setMany({
                  q: "",
                  status: "",
                  overdue: "",
                  priority: "",
                  assigneeId: "",
                  ...(fixedProjectId ? {} : { projectId: "" }),
                })
              }
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
        {viewButtons}
      </section>
      {projects.isError && (
        <QueryErrorState error={projects.error} retry={projects.refetch} />
      )}
      {!personal && members.isError && (
        <QueryErrorState error={members.error} retry={members.refetch} />
      )}
      {query.isError && (
        <QueryErrorState error={query.error} retry={query.refetch} />
      )}{" "}
      {query.isPending && <PageSkeleton variant="table" />}
      {data && !query.isError && (
        <>
          {board ? (
            <div className="board-surface">
              <div
                className="board"
                tabIndex={0}
                role="region"
                aria-label="Bảng trạng thái công việc"
              >
                {taskStatusSchema.options.map((status) => {
                  const items = data.items.filter((t) => t.status === status);
                  return (
                    <section
                      key={status}
                      className="board-column"
                      data-status={status}
                      aria-label={label(status)}
                    >
                      <h2>
                        {label(status)}
                        <span className="board-count">{items.length}</span>
                      </h2>
                      {items.map((t) => (
                        <Link
                          key={t.id}
                          className="board-card"
                          href={`/tasks/${t.id}`}
                        >
                          <span className="board-card-title" title={t.title}>
                            {t.title}
                          </span>
                          {!fixedProjectId && (
                            <span className="small muted">
                              {t.project.name}
                            </span>
                          )}
                          <span className="board-card-meta">
                            <Priority value={t.priority} />
                            <span
                              className={`small ${t.isOverdue ? "task-overdue" : "muted"}`}
                            >
                              {dateTime(t.dueAt)}
                            </span>
                            {t.assignee ? (
                              <Avatar name={t.assignee.displayName} />
                            ) : (
                              <span className="small muted">Chưa giao</span>
                            )}
                          </span>
                        </Link>
                      ))}
                    </section>
                  );
                })}
              </div>
              {!data.items.length && <Empty />}
              <Pagination
                {...data.pagination}
                onPage={(p) => filters.set("page", String(p))}
              />
            </div>
          ) : (
            <DataTable
              pagination={{
                ...data.pagination,
                onPage: (p) => filters.set("page", String(p)),
              }}
              actions
              widths={
                personal
                  ? [28, 12, 20, 15, 15, 10]
                  : fixedProjectId
                    ? [24, 17, 11, 18, 11, 11, 8]
                    : [21, 12, 14, 10, 13, 11, 11, 8]
              }
              headers={[
                "Công việc",
                ...(fixedProjectId || personal ? [] : ["Dự án"]),
                ...(personal ? [] : ["Người thực hiện"]),
                "Ưu tiên",
                "Trạng thái",
                "Ngày bắt đầu",
                "Hạn hoàn thành",
                "Hành động",
              ]}
              rows={data.items.map((t) => [
                <div key="task">
                  <Link
                    key="title"
                    className="issue-link task-name"
                    title={t.title}
                    href={`/tasks/${t.id}`}
                  >
                    {t.title}
                  </Link>
                  {personal && (
                    <span className="small muted task-project">
                      {t.project.name}
                    </span>
                  )}
                </div>,
                ...(fixedProjectId || personal ? [] : [t.project.name]),
                ...(personal
                  ? []
                  : [
                      t.assignee ? (
                        <UserBadge
                          key="assignee"
                          name={t.assignee.displayName}
                        />
                      ) : (
                        "Chưa phân công"
                      ),
                    ]),
                <Priority key="priority" value={t.priority} />,
                <span key="state" className="page-status">
                  <Badge value={t.status} />
                  {t.isOverdue && <Badge value="OVERDUE" />}
                </span>,
                t.firstStartedAt ? dateTime(t.firstStartedAt) : "Chưa bắt đầu",
                dateTime(t.dueAt),
                <DetailLink
                  key="detail"
                  href={`/tasks/${t.id}`}
                  label={`Xem công việc ${t.title}`}
                />,
              ])}
            />
          )}
        </>
      )}
      <HashDialog name="choose-task-project" title="Chọn dự án tạo công việc">
        <Form
          compact
          form={form}
          onSubmit={async (values) => {
            dialog.close();
            router.push(`/projects/${values.projectId}/tasks/new`);
          }}
          submitLabel="Mở biểu mẫu"
        >
          <FormSelect
            label="Dự án bạn quản lý"
            required
            options={manageable.map((p) => ({ value: p.id, label: p.name }))}
            {...form.register("projectId")}
            error={errors.projectId}
          />
        </Form>
      </HashDialog>
    </>
  );
}
