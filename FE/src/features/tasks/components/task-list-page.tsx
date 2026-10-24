"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { HashDialog } from "@/components/ui/dialog";
import {
  Badge,
  DataTable,
  Empty,
  Loading,
  PageHeader,
  Pagination,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import {
  prioritySchema,
  taskStatusSchema,
} from "@/features/tasks/schemas/task.schema";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { dateTime, label } from "@/lib/format";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useListTasksQuery } from "../hooks/use-tasks-queries";

export function TaskListPage({ personal = false }: { personal?: boolean }) {
  const { session } = useSession();
  const filters = useUrlFilters();
  const search = useSearchParams();
  const router = useRouter();
  const dialog = useHashDialog();
  const status = taskStatusSchema.safeParse(filters.get("status"));
  const priority = prioritySchema.safeParse(filters.get("priority"));
  const projectId = filters.get("projectId");
  const projects = useListProjectsQuery({ pageSize: 100 });
  const members = useListProjectMembersQuery(projectId, { pageSize: 100 });
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
  const data = query.data;
  const setView = (view: string) => {
    const next = new URLSearchParams(search);
    if (view) next.set("view", view);
    else next.delete("view");
    router.replace(`?${next}`, { scroll: false });
  };
  return (
    <>
      <PageHeader
        title={personal ? "Công việc của tôi" : "Công việc"}
        description={
          personal
            ? "Các công việc được giao và những việc cần thực hiện."
            : "Theo dõi công việc trong phạm vi dự án được cấp quyền."
        }
        actions={
          <>
            <button onClick={() => setView(board ? "" : "board")}>
              {board ? "Dạng danh sách" : "Bảng trạng thái"}
            </button>
            {manageable.length > 0 && (
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
            )}
          </>
        }
      />
      <section className="panel filters">
        <label>
          Tìm công việc
          <input
            type="search"
            placeholder="Nhập tên công việc…"
            value={filters.get("q")}
            onChange={(e) => filters.set("q", e.target.value)}
          />
        </label>
        <label>
          Dự án
          <select
            value={projectId}
            onChange={(e) => {
              filters.setMany({ projectId: e.target.value, assigneeId: "" });
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
        <label>
          Trạng thái
          <select
            value={filters.get("status")}
            onChange={(e) => filters.set("status", e.target.value)}
          >
            <option value="">Tất cả</option>
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
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.get("overdue") === "true"}
            onChange={(e) =>
              filters.set("overdue", e.target.checked ? "true" : "")
            }
          />
          Chỉ việc quá hạn
        </label>
      </section>
      {query.isError && (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      )}{" "}
      {query.isPending && <Loading />}
      {data && !query.isError && (
        <>
          {board ? (
            <>
              <p className="small muted metadata">
                Phân bố công việc trên trang hiện tại. Mở công việc để thực hiện
                chuyển trạng thái có kiểm tra điều kiện.
              </p>
              <div className="board">
                {taskStatusSchema.options.map((status) => (
                  <section key={status} className="board-column">
                    <h2>
                      {label(status)} ·{" "}
                      {data.items.filter((t) => t.status === status).length}
                    </h2>
                    {data.items
                      .filter((t) => t.status === status)
                      .map((t) => (
                        <Link
                          key={t.id}
                          className="board-card"
                          href={`/tasks/${t.id}`}
                        >
                          <span>{t.title}</span>
                          <p className="muted">{t.project.name}</p>
                          <p>{t.assignee?.displayName ?? "Chưa phân công"}</p>
                          <p className="small">{dateTime(t.dueAt)}</p>
                          {t.isOverdue && <Badge value="OVERDUE" />}
                        </Link>
                      ))}
                  </section>
                ))}
              </div>
              {!data.items.length && <Empty />}
            </>
          ) : (
            <section className="panel">
              <DataTable
                headers={[
                  "Công việc",
                  "Người thực hiện",
                  "Trạng thái",
                  "Hạn hoàn thành",
                ]}
                rows={data.items.map((t) => [
                  <div key="title">
                    <Link className="text-link" href={`/tasks/${t.id}`}>
                      {t.title}
                    </Link>
                    <div className="small muted">
                      {t.project.name} · {label(t.priority)}
                    </div>
                  </div>,
                  t.assignee?.displayName ?? "Chưa phân công",
                  <span key="state">
                    <Badge value={t.status} />
                    {t.isOverdue && <Badge value="OVERDUE" />}
                  </span>,
                  dateTime(t.dueAt),
                ])}
              />
            </section>
          )}
          <Pagination
            {...data.pagination}
            onPage={(p) => filters.set("page", String(p))}
          />
        </>
      )}
      <HashDialog name="choose-task-project" title="Chọn dự án tạo công việc">
        <SchemaForm
          schema={z.object({ projectId: z.string().min(1) }).strict()}
          fields={[
            {
              name: "projectId",
              label: "Dự án đang triển khai",
              type: "select",
              options: manageable.map((p) => ({ value: p.id, label: p.name })),
              required: true,
            },
          ]}
          onSubmit={async (values) => {
            dialog.close();
            router.push(`/projects/${values.projectId}/tasks/new`);
          }}
          submitLabel="Mở biểu mẫu"
        />
      </HashDialog>
    </>
  );
}
