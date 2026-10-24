"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/session-context";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListTasksQuery } from "../hooks/use-tasks-queries";
import {
  TasksTaskStatusSchema,
  type TasksTaskDTO,
} from "../schemas/tasks.schema";

const labels: Record<TasksTaskDTO["status"], string> = {
  NEW: "Mới tạo",
  TODO: "Chờ thực hiện",
  IN_PROGRESS: "Đang thực hiện",
  PENDING_REVIEW: "Chờ nghiệm thu",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function TaskListPage({ personal = false }: { personal?: boolean }) {
  const { session } = useSession();
  const search = useSearchParams();
  const router = useRouter();
  const status = TasksTaskStatusSchema.safeParse(search.get("status"));
  const page = Number(search.get("page") || 1);
  const query = useListTasksQuery({
    query: {
      q: search.get("q") || undefined,
      status: status.success ? status.data : undefined,
      overdue: search.get("overdue") === "true" ? true : undefined,
      ...(personal ? { assigneeId: session?.user.id } : {}),
      page: Number.isSafeInteger(page) && page > 0 ? page : 1,
      pageSize: 20,
    },
  });
  const data = query.data;

  function update(key: string, value: string) {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`?${next}`, { scroll: false });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KHÔNG GIAN LÀM VIỆC</span>
          <h1>
            {personal
              ? `Chào ${session?.user.displayName.split(" ").at(-1) ?? "bạn"},`
              : "Công việc"}
          </h1>
          <p className="muted">
            {personal
              ? "Các công việc đang được giao cho bạn."
              : "Theo dõi công việc trong phạm vi dự án được cấp quyền."}
          </p>
        </div>
      </div>
      <section className="panel filters">
        <label>
          Tìm công việc
          <input
            type="search"
            defaultValue={search.get("q") ?? ""}
            placeholder="Nhập tên công việc…"
            onChange={(e) => update("q", e.target.value)}
          />
        </label>
        <label>
          Trạng thái
          <select
            value={search.get("status") ?? ""}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {TasksTaskStatusSchema.options.map((v) => (
              <option key={v} value={v}>
                {labels[v]}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={search.get("overdue") === "true"}
            onChange={(e) => update("overdue", e.target.checked ? "true" : "")}
          />
          Chỉ việc quá hạn
        </label>
      </section>
      {query.isError && (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      )}
      {!data && query.isPending && (
        <div className="panel skeleton" role="status">
          Đang tải công việc…
        </div>
      )}
      {data && (
        <section className="panel table-panel">
          <div className="table-heading">
            <h2>{personal ? "Công việc của tôi" : "Danh sách công việc"}</h2>
            <span className="muted small">
              {query.isFetching
                ? "Đang làm mới…"
                : `${data.pagination.total} công việc`}
            </span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Công việc</th>
                  <th>Người thực hiện</th>
                  <th>Trạng thái</th>
                  <th>Hạn hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="task-title">{t.title}</span>
                      <div className="muted small">{t.project.name}</div>
                    </td>
                    <td>{t.assignee?.displayName ?? "Chưa phân công"}</td>
                    <td>
                      <span className={`badge ${t.status.toLowerCase()}`}>
                        {labels[t.status]}
                      </span>
                      {t.isOverdue && (
                        <span className="badge overdue">Quá hạn</span>
                      )}
                    </td>
                    <td>{dateFormat.format(new Date(t.dueAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.items.length === 0 && (
              <div className="empty-state">
                <h2>Chưa có công việc phù hợp</h2>
                <p className="muted">
                  Thử thay đổi từ khóa hoặc bộ lọc trong phạm vi được xem.
                </p>
              </div>
            )}
          </div>
          <footer className="table-footer">
            <span className="small muted">
              Quá hạn được hiển thị riêng với trạng thái thực hiện.
            </span>
            <div>
              <button
                disabled={data.pagination.page <= 1}
                onClick={() => update("page", String(data.pagination.page - 1))}
              >
                Trước
              </button>
              <span className="page-number">{data.pagination.page}</span>
              <button
                disabled={
                  data.pagination.page * data.pagination.pageSize >=
                  data.pagination.total
                }
                onClick={() => update("page", String(data.pagination.page + 1))}
              >
                Sau
              </button>
            </div>
          </footer>
        </section>
      )}
      <p className="muted small data-note">
        Ngày làm việc theo giờ Việt Nam · Quyền và dữ liệu được kiểm tra tại API
      </p>
    </>
  );
}
