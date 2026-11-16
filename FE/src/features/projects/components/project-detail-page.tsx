"use client";

import { Button } from "@/components/ui/button";
import { RecordStamp } from "@/components/ui/record-stamp";
import { HeaderActions } from "@/components/ui/header-actions";
import { HistoryTable } from "@/components/ui/history-table";
import { PageSkeleton, Spinner } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { SlidePanel } from "@/components/ui/slide-panel";
import { UserBadge } from "@/components/ui/user-badge";
import { ProjectMembersSummary } from "@/features/project-members/components/project-members-summary";
import { TaskListPage } from "@/features/tasks/components/task-list-page";
import { useListTasksQuery } from "@/features/tasks/hooks/use-tasks-queries";
import type { TaskRow } from "@/features/tasks/types/tasks.types";
import { cn } from "@/lib/cn";
import { dateTime } from "@/lib/format";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useId } from "react";
import {
  useGetProjectQuery,
  useListProjectHistoryQuery,
} from "../hooks/use-projects-queries";

const segments = [
  {
    key: "done",
    label: "Hoàn thành",
    dot: "bg-success-fg",
    arc: "stroke-success-fg",
  },
  {
    key: "review",
    label: "Chờ nghiệm thu",
    dot: "bg-warning-fg",
    arc: "stroke-warning-fg",
  },
  {
    key: "doing",
    label: "Đang thực hiện",
    dot: "bg-action",
    arc: "stroke-action",
  },
  {
    key: "todo",
    label: "Chưa bắt đầu",
    dot: "bg-line-input",
    arc: "stroke-line-input",
  },
] as const;
const ringRadius = 32;
const ringLength = 2 * Math.PI * ringRadius;

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

function Health({ tasks, total }: { tasks: TaskRow[]; total: number }) {
  const titleId = useId();
  const counts = { done: 0, review: 0, doing: 0, todo: 0, cancelled: 0 };
  for (const task of tasks) counts[bucket(task)]++;
  const active = tasks.length - counts.cancelled;
  const percent = active ? Math.round((counts.done / active) * 100) : 0;
  const arcs = segments.map((s, index) => ({
    ...s,
    count: counts[s.key],
    before: segments
      .slice(0, index)
      .reduce((sum, previous) => sum + counts[previous.key], 0),
  }));
  return (
    <section
      aria-labelledby={titleId}
      className="min-w-0 border-t border-line pt-4 @min-[56.25rem]/page:border-t-0 @min-[56.25rem]/page:border-l @min-[56.25rem]/page:pt-0 @min-[56.25rem]/page:pl-5"
    >
      <h2 id={titleId} className="m-0 mb-3 text-sm font-semibold text-fg">
        Tiến độ công việc
      </h2>
      {active === 0 ? (
        <p className="m-0 text-sm text-fg-subtle">
          Dự án chưa có công việc nào đang theo dõi.
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative size-20 shrink-0">
            <svg
              viewBox="0 0 80 80"
              className="size-full -rotate-90"
              role="img"
              aria-label={`Hoàn thành ${percent}%, ${counts.done}/${active} việc`}
            >
              <circle
                cx="40"
                cy="40"
                r={ringRadius}
                fill="none"
                strokeWidth="10"
                className="stroke-sunken"
              />
              {arcs.map((arc) => {
                const length = (arc.count / active) * ringLength;
                return (
                  <circle
                    key={arc.key}
                    cx="40"
                    cy="40"
                    r={ringRadius}
                    fill="none"
                    strokeWidth="10"
                    strokeDasharray={`${length} ${ringLength - length}`}
                    strokeDashoffset={-(arc.before / active) * ringLength}
                    className={arc.arc}
                  />
                );
              })}
            </svg>
            <p
              aria-hidden="true"
              className="absolute inset-0 m-0 grid place-content-center text-center leading-tight tabular-nums"
            >
              <b className="text-base font-semibold text-fg">{percent}%</b>
              <span className="text-xs text-fg-subtle">
                {counts.done}/{active}
              </span>
            </p>
          </div>
          <ul className="m-0 grid min-w-0 flex-1 list-none gap-1.5 p-0 text-xs">
            {arcs.map((arc) => (
              <li key={arc.key} className="flex items-center gap-2">
                <span
                  className={cn("size-2 shrink-0 rounded-full", arc.dot)}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-fg-subtle">
                  {arc.label}
                </span>
                <b className="font-semibold text-fg tabular-nums">
                  {arc.count}
                </b>
              </li>
            ))}
          </ul>
        </div>
      )}
      {total > tasks.length && (
        <p className="m-0 mt-3 text-xs text-fg-subtle">
          Tính trên {tasks.length}/{total} việc của dự án.
        </p>
      )}
    </section>
  );
}

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const dialog = useHashDialog();
  const project = useGetProjectQuery(projectId);
  const tasks = useListTasksQuery({ projectId, pageSize: 100 });
  if (project.isError)
    return <QueryErrorState error={project.error} retry={project.refetch} />;
  if (!project.data) return <PageSkeleton />;
  const p = project.data;
  return (
    <>
      <section
        aria-label="Tổng quan dự án"
        className="mb-5 grid gap-5 rounded-lg bg-sunken/60 p-4 @min-[56.25rem]/page:grid-cols-[minmax(0,1fr)_18.75rem]"
      >
        <div className="grid min-w-0 content-start gap-4">
          <section>
            <h2 className="m-0 mb-2 text-sm font-semibold text-fg">
              Mục tiêu dự án
            </h2>
            <p className="m-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-fg">
              {p.objective}
            </p>
          </section>
          <dl className="m-0 grid gap-4 @min-[37.5rem]/page:grid-cols-3">
            <div className="grid content-start gap-1">
              <dt className="text-xs text-fg-subtle">Người phụ trách</dt>
              <dd className="m-0 min-w-0 text-sm">
                <UserBadge
                  name={p.owner.displayName}
                  href={`/users/${encodeURIComponent(p.owner.id)}`}
                />
              </dd>
            </div>
            <div className="grid content-start gap-1">
              <dt className="text-xs text-fg-subtle">Ngày bắt đầu</dt>
              <dd className="m-0 text-sm">
                {p.startDate.split("-").reverse().join("/")}
              </dd>
            </div>
            <div className="grid content-start gap-1">
              <dt className="text-xs text-fg-subtle">Hạn hoàn thành</dt>
              <dd className="m-0 text-sm">{dateTime(p.dueAt)}</dd>
            </div>
          </dl>
          <RecordStamp
            createdBy={p.createdBy}
            createdAt={p.createdAt}
            updatedBy={p.updatedBy}
            updatedAt={p.updatedAt}
          />
        </div>
        {tasks.isError ? (
          <QueryErrorState error={tasks.error} retry={tasks.refetch} />
        ) : !tasks.data ? (
          <p
            role="status"
            className="m-0 inline-flex items-center gap-2 text-sm text-fg-subtle"
          >
            <Spinner />
            Đang tải tiến độ…
          </p>
        ) : (
          <Health
            tasks={tasks.data.items}
            total={tasks.data.pagination.total}
          />
        )}
      </section>
      <div className="grid items-start gap-5 @min-[68.75rem]/page:grid-cols-[minmax(0,1fr)_15rem]">
        <section id="tasks" aria-label="Công việc dự án" className="min-w-0">
          <h2 className="m-0 mb-3 flex min-h-8 items-center text-heading-sm font-semibold text-fg">
            Công việc dự án
          </h2>
          <TaskListPage projectId={projectId} />
        </section>
        <ProjectMembersSummary projectId={projectId} />
      </div>
      <HeaderActions>
        <Button size="sm" onClick={() => dialog.open("history")}>Lịch sử dự án</Button>
      </HeaderActions>
      <SlidePanel
        size="lg"
        open={dialog.name === "history"}
        onOpenChange={(open) => {
          if (!open) dialog.close();
        }}
        title="Lịch sử dự án"
        closeLabel="Đóng lịch sử dự án"
      >
        <ProjectHistoryTable projectId={projectId} />
      </SlidePanel>
    </>
  );
}

function ProjectHistoryTable({ projectId }: { projectId: string }) {
  const filters = useUrlFilters("history.");
  const history = useListProjectHistoryQuery(projectId, { page: filters.page });
  if (history.isError)
    return <QueryErrorState error={history.error} retry={history.refetch} />;
  if (!history.data) return <PageSkeleton variant="table" />;
  return (
    <HistoryTable
      loading={history.isFetching}
      title="Các mốc triển khai"
      pagination={{
        ...history.data.pagination,
        onPage: (page) => filters.set("page", String(page)),
      }}
      items={history.data.items}
    />
  );
}
