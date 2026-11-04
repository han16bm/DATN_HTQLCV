"use client";

import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { SplitLayout } from "@/components/patterns/split-layout";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { HistoryTable } from "@/components/ui/history-table";
import { PageSkeleton } from "@/components/ui/loading";
import { StatusLozenge } from "@/components/ui/lozenge";
import { Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useListTasksQuery } from "@/features/tasks/hooks/use-tasks-queries";
import type { TaskRow } from "@/features/tasks/types/tasks.types";
import { cn } from "@/lib/cn";
import { dateTime } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId } from "react";
import {
  useGetProjectQuery,
  useListProjectHistoryQuery,
} from "../hooks/use-projects-queries";

const segments = [
  { key: "done", label: "Hoàn thành", bar: "bg-success-fg" },
  { key: "review", label: "Chờ nghiệm thu", bar: "bg-warning-fg" },
  { key: "doing", label: "Đang thực hiện", bar: "bg-action" },
  { key: "todo", label: "Chưa bắt đầu", bar: "bg-line-input" },
] as const;

const bucket = (task: TaskRow) =>
  task.status === "COMPLETED"
    ? "done"
    : task.status === "PENDING_REVIEW"
      ? "review"
      : task.status === "IN_PROGRESS"
        ? "doing"
        : task.status === "CANCELLED"
          ? "cancelled"
          : "todo";

// Tình hình công việc của dự án: thanh phân bố theo trạng thái và tỉ lệ hoàn thành.
function Health({ tasks, total }: { tasks: TaskRow[]; total: number }) {
  const titleId = useId();
  const counts = { done: 0, review: 0, doing: 0, todo: 0, cancelled: 0 };
  for (const task of tasks) counts[bucket(task)]++;
  const active = tasks.length - counts.cancelled;
  const percent = active ? Math.round((counts.done / active) * 100) : 0;
  return (
    <section
      aria-labelledby={titleId}
      className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-4"
    >
      {/* Theo progress bar của Carbon: nhãn trên thanh, giá trị sát nhãn, chú giải dưới. */}
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={titleId} className="m-0 text-heading-sm font-semibold text-fg">
          Tiến độ công việc
        </h2>
        {active > 0 && (
          <p className="m-0 text-sm text-fg-subtle tabular-nums">
            <b className="font-semibold text-fg">{percent}%</b>
            {" · "}
            {counts.done}/{active} việc hoàn thành
          </p>
        )}
      </div>
      {active === 0 ? (
        <p className="m-0 text-sm text-fg-subtle">
          Dự án chưa có công việc nào đang theo dõi.
        </p>
      ) : (
        <>
          <div
            className="flex h-2 overflow-hidden rounded-full bg-sunken"
            role="img"
            aria-label={`Hoàn thành ${percent}%`}
          >
            {segments.map((s) => (
              <span
                key={s.key}
                className={s.bar}
                style={{ width: `${(counts[s.key] / active) * 100}%` }}
              />
            ))}
          </div>
          <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-1 p-0 text-xs @min-[560px]/page:grid-cols-4">
            {segments.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span
                  className={cn("size-2 shrink-0 rounded-full", s.bar)}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-fg-subtle">
                  {s.label}
                </span>
                <b className="font-semibold text-fg tabular-nums">
                  {counts[s.key]}
                </b>
              </li>
            ))}
          </ul>
          {total > tasks.length && (
            <p className="m-0 text-xs text-fg-subtle">
              Tính trên {tasks.length}/{total} việc của dự án.
            </p>
          )}
        </>
      )}
    </section>
  );
}

const taskHeaders = [
  "Công việc",
  "Người thực hiện",
  "Hạn hoàn thành",
  "Trạng thái",
];

const taskRows = (tasks: TaskRow[]) =>
  tasks.map((t) => [
    <Link
      key="title"
      href={`/tasks/${encodeURIComponent(t.id)}`}
      className="block max-w-[30ch] truncate font-medium text-fg hover:text-selected-fg hover:underline"
      title={t.title}
    >
      {t.title}
    </Link>,
    t.assignee ? (
      <UserBadge key="assignee" name={t.assignee.displayName} />
    ) : (
      "Chưa phân công"
    ),
    <span key="due" className={cn(t.isOverdue && "font-medium text-danger-fg")}>
      {dateTime(t.dueAt)}
    </span>,
    <span key="state" className="flex flex-wrap gap-1">
      <StatusLozenge value={t.status} />
      {t.isOverdue && <StatusLozenge value="OVERDUE" />}
    </span>,
  ]);

// Tổng quan dự án: tình hình trước, việc cần chú ý và đang diễn ra ở giữa; kế hoạch,
// mục tiêu và mốc triển khai ở cột phụ.
export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const search = useSearchParams();
  const filters = useUrlFilters();
  const project = useGetProjectQuery(projectId);
  const history = useListProjectHistoryQuery(projectId, {
    page: filters.page,
    pageSize: search.get("tab") === "history" ? 20 : 5,
  });
  const tasks = useListTasksQuery({ projectId, pageSize: 100 });
  if (project.isError) return <QueryErrorState error={project.error} />;
  if (!project.data) return <PageSkeleton />;
  if (search.get("tab") === "history")
    return history.isError ? (
      <QueryErrorState error={history.error} retry={history.refetch} />
    ) : !history.data ? (
      <PageSkeleton variant="table" />
    ) : (
      <HistoryTable
        loading={history.isFetching}
        title="Lịch sử dự án"
        pagination={{
          ...history.data.pagination,
          onPage: (p) => filters.set("page", String(p)),
        }}
        items={history.data.items}
      />
    );
  const p = project.data;
  const items = tasks.data?.items ?? [];
  const overdue = items.filter(
    (t) => t.isOverdue && !["COMPLETED", "CANCELLED"].includes(t.status),
  );
  const waiting = items.filter((t) => t.status === "PENDING_REVIEW");
  const doing = items.filter((t) => t.status === "IN_PROGRESS" && !t.isOverdue);
  // Một bảng: quá hạn trước, rồi chờ nghiệm thu, rồi đang thực hiện; cột Trạng thái
  // cho biết từng việc đang ở đâu.
  const tracked = [
    ...overdue,
    ...waiting.filter((t) => !t.isOverdue),
    ...doing,
  ];
  return (
    <>
      {tasks.data && !tasks.isError && (
        <Health tasks={items} total={tasks.data.pagination.total} />
      )}
      <SplitLayout
        aside={
          <aside
            aria-label="Kế hoạch dự án"
            className="grid content-start gap-5"
          >
            <Panel title="Thông tin kế hoạch">
              <KeyValueList>
                <KeyValue label="Mã dự án">{p.code}</KeyValue>
                <KeyValue label="Người phụ trách">
                  <UserBadge
                    name={p.owner.displayName}
                    href={`/users/${p.owner.id}`}
                  />
                </KeyValue>
                <KeyValue label="Đơn vị">{p.unit.name}</KeyValue>
                <KeyValue label="Ngày bắt đầu">
                  {p.startDate.split("-").reverse().join("/")}
                </KeyValue>
                <KeyValue label="Hạn hoàn thành">{dateTime(p.dueAt)}</KeyValue>
              </KeyValueList>
            </Panel>
            <Panel title="Mục tiêu dự án">
              <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap text-fg">
                {p.objective}
              </p>
            </Panel>
          </aside>
        }
      >
        {tasks.isError ? (
          <QueryErrorState error={tasks.error} retry={tasks.refetch} />
        ) : !tasks.data ? (
          <PageSkeleton variant="cards" />
        ) : (
          <>
            <DataTable
              loading={tasks.isFetching}
              title={`Công việc cần theo dõi (${tracked.length})`}
              widths={[34, 24, 24, 18]}
              headers={taskHeaders}
              rows={taskRows(tracked)}
              empty={
                <EmptyState
                  title="Chưa có việc cần theo dõi"
                  message="Không có việc quá hạn, đang thực hiện hay chờ nghiệm thu."
                  className="py-4"
                />
              }
            />
          </>
        )}
        {history.isError ? (
          <QueryErrorState error={history.error} retry={history.refetch} />
        ) : !history.data ? (
          <PageSkeleton variant="table" />
        ) : (
          <HistoryTable
            loading={history.isFetching}
            title="Các mốc triển khai"
            items={history.data.items}
          />
        )}
      </SplitLayout>
    </>
  );
}
