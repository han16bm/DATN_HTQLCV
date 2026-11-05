"use client";

import { DataTable } from "@/components/patterns/data-table";
import { SplitLayout } from "@/components/patterns/split-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { PageSkeleton } from "@/components/ui/loading";
import { StatusLozenge } from "@/components/ui/lozenge";
import { MenuContent, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { ButtonLink, PageHeader, Panel, linkClass } from "@/components/ui/page";
import { ProjectTile } from "@/components/ui/project-tile";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { useListReportsQuery } from "@/features/reports/hooks/use-reports-queries";
import { useListReviewQueueQuery } from "@/features/submissions/hooks/use-submissions-queries";
import { canVisit } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { cn } from "@/lib/cn";
import { dateTime, label } from "@/lib/format";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useListTasksQuery } from "../hooks/use-tasks-queries";
import type { TaskRow } from "../types/tasks.types";
import { CreateTaskAction } from "./create-task-action";

type View = "all" | "overdue" | "doing" | "upcoming" | "waiting";

function groupOf(task: TaskRow): Exclude<View, "all"> {
  if (task.isOverdue) return "overdue";
  if (task.status === "IN_PROGRESS") return "doing";
  if (task.status === "PENDING_REVIEW") return "waiting";
  return "upcoming";
}

const groups: { key: Exclude<View, "all">; title: string }[] = [
  { key: "overdue", title: "Quá hạn" },
  { key: "doing", title: "Đang thực hiện" },
  { key: "waiting", title: "Chờ nghiệm thu" },
  { key: "upcoming", title: "Sắp tới" },
];

function actionsOf(task: TaskRow) {
  const base = `/tasks/${encodeURIComponent(task.id)}`;
  if (task.status === "TODO")
    return [{ href: `${base}#execution`, label: "Bắt đầu", primary: true }];
  if (task.status === "IN_PROGRESS")
    return [
      { href: `${base}#time-log`, label: "Ghi giờ", primary: false },
      { href: `${base}#submit`, label: "Nộp kết quả", primary: true },
    ];
  return [];
}

function TaskMenu({ task }: { task: TaskRow }) {
  const quick = actionsOf(task);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton label={`Thao tác: ${task.title}`}>
          <Ellipsis className="size-[17px]" aria-hidden="true" />
        </IconButton>
      </DropdownMenu.Trigger>
      <MenuContent>
        {quick.map((action) => (
          <MenuItem asChild key={action.label}>
            <Link href={action.href}>{action.label}</Link>
          </MenuItem>
        ))}
        {quick.length > 0 && <MenuSeparator />}
        <MenuItem asChild>
          <Link href={`/tasks/${encodeURIComponent(task.id)}`}>
            Xem chi tiết
          </Link>
        </MenuItem>
      </MenuContent>
    </DropdownMenu.Root>
  );
}

export function TodayPage() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const canReview = canVisit(session, "/reviews");
  const [view, setView] = useState<View>("all");
  const tasks = useListTasksQuery({ assigneeId: userId, pageSize: 100 });
  const reviews = useListReviewQueueQuery(
    { pageSize: 3 },
    { enabled: canReview },
  );
  const drafts = useListReportsQuery({
    authorId: userId,
    status: "DRAFT",
    pageSize: 3,
  });
  const projects = useListProjectsQuery({ pageSize: 6 });
  const open = (tasks.data?.items ?? [])
    .filter((t) =>
      ["NEW", "TODO", "IN_PROGRESS", "PENDING_REVIEW"].includes(t.status),
    )
    .sort(
      (a, b) =>
        groups.findIndex((g) => g.key === groupOf(a)) -
          groups.findIndex((g) => g.key === groupOf(b)) ||
        a.dueAt.localeCompare(b.dueAt),
    );
  const count = (key: View) =>
    key === "all" ? open.length : open.filter((t) => groupOf(t) === key).length;
  const chips: { key: View; title: string }[] = [
    { key: "all", title: "Tất cả" },
    ...groups.map((g) => ({ key: g.key, title: g.title })),
  ];
  const shown = open.filter((t) => view === "all" || groupOf(t) === view);
  const truncated =
    tasks.data && tasks.data.pagination.total > tasks.data.items.length;
  return (
    <>
      <PageHeader
        title="Hôm nay"
        description={`Xin chào, ${session?.user.displayName ?? "bạn"}. ${new Intl.DateTimeFormat(
          "vi-VN",
          {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "Asia/Ho_Chi_Minh",
          },
        ).format(new Date())}`}
        actions={<CreateTaskAction />}
      />
      <SplitLayout
        aside={
          <aside aria-label="Cần chú ý" className="grid content-start gap-5">
            {canReview && (
              <Panel
                title="Chờ nghiệm thu"
                flush
                actions={
                  <Link className={`${linkClass} text-sm`} href="/reviews">
                    Mở hàng chờ
                  </Link>
                }
              >
                {reviews.isError ? (
                  <p className="m-0 p-3.5 text-sm text-danger-fg">
                    Không tải được hàng chờ.
                  </p>
                ) : !reviews.data ? (
                  <p className="m-0 p-3.5 text-sm text-fg-subtle">Đang tải…</p>
                ) : reviews.data.items.length ? (
                  <ul className="m-0 list-none p-0">
                    {reviews.data.items.map((s) => (
                      <li
                        key={s.id}
                        className="border-t border-line first:border-t-0"
                      >
                        <Link
                          href={`/reviews?s=${encodeURIComponent(s.id)}`}
                          className="block px-3.5 py-2 hover:bg-hover"
                        >
                          <span className="block truncate text-sm font-medium text-fg">
                            {s.taskTitle}
                          </span>
                          <span className="block text-xs text-fg-subtle">
                            {s.submitter.displayName} · lần {s.sequence}
                          </span>
                        </Link>
                      </li>
                    ))}
                    {reviews.data.pagination.total >
                      reviews.data.items.length && (
                      <li className="border-t border-line px-3.5 py-2 text-xs text-fg-subtle">
                        và{" "}
                        {reviews.data.pagination.total -
                          reviews.data.items.length}{" "}
                        kết quả khác
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="m-0 p-3.5 text-sm text-fg-subtle">
                    Không có kết quả nào đang chờ.
                  </p>
                )}
              </Panel>
            )}
            <Panel
              title="Báo cáo nháp"
              flush
              actions={
                <Link className={`${linkClass} text-sm`} href="/reports">
                  Tất cả báo cáo
                </Link>
              }
            >
              {drafts.data?.items.length ? (
                <ul className="m-0 list-none p-0">
                  {drafts.data.items.map((r) => (
                    <li
                      key={r.id}
                      className="border-t border-line first:border-t-0"
                    >
                      <Link
                        href={`/reports/${encodeURIComponent(r.id)}/edit`}
                        className="block px-3.5 py-2 hover:bg-hover"
                      >
                        <span className="block text-sm font-medium text-fg">
                          {label(r.periodType)} ·{" "}
                          {r.periodStart.split("-").reverse().join("/")}
                        </span>
                        <span className="block text-xs text-fg-subtle">
                          {r.project.name} · Tiếp tục viết
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 p-3.5 text-sm text-fg-subtle">
                  {drafts.isPending ? "Đang tải…" : "Không có báo cáo nháp."}
                </p>
              )}
            </Panel>
            <Panel
              title="Dự án của tôi"
              flush
              actions={
                <Link className={`${linkClass} text-sm`} href="/projects">
                  Xem tất cả dự án
                </Link>
              }
            >
              {projects.data?.items.length ? (
                <ul className="m-0 list-none p-0">
                  {projects.data.items.map((p) => (
                    <li
                      key={p.id}
                      className="border-t border-line first:border-t-0"
                    >
                      <Link
                        href={`/projects/${p.id}`}
                        className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 px-3.5 py-2 hover:bg-hover"
                      >
                        <ProjectTile id={p.id} small />
                        <span className="grid min-w-0 leading-snug">
                          <span className="truncate text-sm font-medium text-fg">
                            {p.name}
                          </span>
                          <span className="truncate text-xs text-fg-subtle">
                            Hạn {dateTime(p.dueAt)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 p-3.5 text-sm text-fg-subtle">
                  {projects.isPending
                    ? "Đang tải…"
                    : "Bạn chưa tham gia dự án nào."}
                </p>
              )}
            </Panel>
          </aside>
        }
      >
        {tasks.isError ? (
          <QueryErrorState error={tasks.error} retry={tasks.refetch} />
        ) : !tasks.data ? (
          <PageSkeleton variant="table" />
        ) : (
          <section aria-label="Việc của tôi" className="grid gap-3">
            <div
              role="group"
              aria-label="Lọc theo mức cần làm"
              className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-2"
            >
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  data-ui
                  type="button"
                  aria-pressed={view === chip.key}
                  onClick={() => setView(chip.key)}
                  className="flex min-h-16 flex-col items-start justify-between gap-1 rounded-lg border border-line bg-surface px-3 py-2 text-left text-xs font-medium text-fg-subtle transition-colors hover:bg-sunken aria-pressed:border-action aria-pressed:bg-selected-bg aria-pressed:text-selected-fg pointer-coarse:min-h-16"
                >
                  {chip.title}
                  <b className="text-xl leading-6 font-semibold tabular-nums">
                    {count(chip.key)}
                  </b>
                </button>
              ))}
            </div>
            {open.length === 0 ? (
              <Panel>
                <EmptyState
                  title="Bạn đã xử lý hết công việc đang mở"
                  message="Việc mới được giao sẽ xuất hiện ở đây."
                  action={
                    <ButtonLink href="/tasks">Xem tất cả công việc</ButtonLink>
                  }
                />
              </Panel>
            ) : (
              <DataTable
                loading={tasks.isFetching}
                actions
                filtered={view !== "all"}
                onClearFilters={() => setView("all")}
                widths={[32, 22, 18, 18, 10]}
                headers={[
                  "Công việc",
                  "Dự án",
                  "Hạn hoàn thành",
                  "Trạng thái",
                  "Hành động",
                ]}
                rows={shown.map((t) => [
                  <Link
                    key="title"
                    href={`/tasks/${encodeURIComponent(t.id)}`}
                    className="block max-w-[34ch] truncate font-medium text-fg hover:text-selected-fg hover:underline"
                    title={t.title}
                  >
                    {t.title}
                  </Link>,
                  t.project.name,
                  <span
                    key="due"
                    className={cn(t.isOverdue && "font-medium text-danger-fg")}
                  >
                    {dateTime(t.dueAt)}
                  </span>,
                  <span key="state" className="flex flex-wrap gap-1">
                    <StatusLozenge value={t.status} />
                    {t.isOverdue && <StatusLozenge value="OVERDUE" />}
                  </span>,
                  <TaskMenu key="actions" task={t} />,
                ])}
              />
            )}
            {truncated && (
              <p className="m-0 text-xs text-fg-subtle">
                Đang hiển thị {tasks.data.items.length} trên{" "}
                {tasks.data.pagination.total} việc.{" "}
                <Link
                  className={linkClass}
                  href={`/tasks?assigneeId=${encodeURIComponent(userId)}`}
                >
                  Xem đầy đủ trong danh sách công việc
                </Link>
              </p>
            )}
          </section>
        )}
      </SplitLayout>
    </>
  );
}
