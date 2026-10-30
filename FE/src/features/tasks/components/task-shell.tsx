"use client";
import { hasPermission } from "@/lib/auth/access";

import { PageSkeleton } from "@/components/ui/loading";
import { PageHeader, SectionNav, StatusField } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { SubmitResultDialog } from "@/features/submissions/components/submit-result-dialog";
import { ReviewDialog } from "@/features/submissions/components/review-dialog";
import { TimeLogDialog } from "@/features/time-logs/components/time-log-dialog";
import { useSession } from "@/lib/auth/session-context";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useGetTaskQuery } from "../hooks/use-tasks-queries";
import { TaskAssignmentDialog, TaskExecutionDialog } from "./task-commands";

export function TaskShell({
  taskId,
  children,
}: {
  taskId: string;
  children: ReactNode;
}) {
  const query = useGetTaskQuery(taskId);
  const project = useGetProjectQuery(query.data?.projectId ?? "");
  const { session } = useSession();
  const dialog = useHashDialog();
  const path = usePathname();
  useCrumbLabel("task", taskId, query.data?.title, query.data?.projectId);
  useCrumbLabel(
    "project",
    query.data?.projectId ?? "",
    query.data?.project.name,
  );
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (!query.data) return <PageSkeleton />;
  const task = query.data;
  const root = `/tasks/${taskId}`;
  const active = project.data?.status === "ACTIVE";
  const editable =
    active && ["NEW", "TODO", "IN_PROGRESS"].includes(task.status);
  const manage = hasPermission(session, "TASKS_MANAGE", task.projectId);
  const own = task.assigneeId === session?.user.id;
  const working = active && own && task.status === "IN_PROGRESS";
  const start = editable && own && task.status === "TODO";
  const change = editable && manage;
  const assign = change && !task.assigneeId;
  const stop = editable && !start && (manage || working);
  const review =
    active &&
    task.status === "PENDING_REVIEW" &&
    task.latestSubmissionId &&
    !own &&
    hasPermission(session, "TASKS_REVIEW", task.projectId) &&
    (!path.startsWith(`${root}/submissions/`) ||
      path === `${root}/submissions/${task.latestSubmissionId}`);
  const navigation = (
    <SectionNav
      label="Mục công việc"
      items={[
        { href: root, label: "Chi tiết", active: path === root },
        {
          href: `${root}/time-logs`,
          label: "Giờ công",
          active: path === `${root}/time-logs`,
        },
        {
          href: `${root}/submissions`,
          label: "Các lần nộp",
          active: path.startsWith(`${root}/submissions`),
        },
        {
          href: `${root}/history`,
          label: "Lịch sử",
          active: path === `${root}/history`,
        },
        ...(path === `${root}/edit`
          ? [{ href: path, label: "Điều chỉnh", active: true }]
          : []),
      ]}
    />
  );
  return (
    <>
      <PageHeader
        title={task.title}
        navigation={navigation}
        status={
          <>
            <StatusField value={task.status} />
            <StatusField label="Ưu tiên" value={task.priority} />
            {task.isOverdue && <StatusField label="Tiến độ" value="OVERDUE" />}
          </>
        }
        actions={
          <>
            {review && (
              <button className="primary" onClick={() => dialog.open("review")}>
                Quyết định nghiệm thu
              </button>
            )}
            {working && (
              <>
                <button
                  className="primary"
                  onClick={() => dialog.open("submit")}
                >
                  Nộp kết quả
                </button>
                <button onClick={() => dialog.open("time-log")}>
                  Ghi giờ công
                </button>
              </>
            )}
            {start && (
              <button
                className="primary"
                onClick={() => dialog.open("execution")}
              >
                Bắt đầu
              </button>
            )}
            {assign && (
              <button
                className="primary"
                onClick={() => dialog.open("assignment")}
              >
                Giao việc
              </button>
            )}
            {(working || change || stop) && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="icon-button bordered"
                    aria-label="Thao tác công việc"
                  >
                    <Ellipsis size={18} aria-hidden="true" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="account-menu"
                    align="end"
                    sideOffset={8}
                    collisionPadding={12}
                  >
                    {working && (
                      <DropdownMenu.Item
                        className="account-menu-item"
                        onSelect={() => dialog.open("attachment")}
                      >
                        Tải minh chứng
                      </DropdownMenu.Item>
                    )}
                    {change && (
                      <>
                        {path !== `${root}/edit` && (
                          <DropdownMenu.Item asChild>
                            <Link
                              className="account-menu-item"
                              href={`${root}/edit`}
                            >
                              Điều chỉnh
                            </Link>
                          </DropdownMenu.Item>
                        )}
                        {!assign && (
                          <DropdownMenu.Item
                            className="account-menu-item"
                            onSelect={() => dialog.open("assignment")}
                          >
                            Bàn giao
                          </DropdownMenu.Item>
                        )}
                      </>
                    )}
                    {stop && (
                      <>
                        {(working || change) && (
                          <DropdownMenu.Separator className="account-menu-separator" />
                        )}
                        <DropdownMenu.Item
                          className="account-menu-item danger"
                          onSelect={() => dialog.open("execution")}
                        >
                          {working ? "Tạm dừng / hủy" : "Hủy công việc"}
                        </DropdownMenu.Item>
                      </>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </>
        }
      />

      {project.isError && (
        <QueryErrorState
          error={project.error}
          retry={() => void project.refetch()}
        />
      )}
      {children}
      {review && <ReviewDialog task={task} />}
      {editable && manage && (
        <TaskAssignmentDialog task={task} reload={query.refetch} />
      )}
      {editable && <TaskExecutionDialog task={task} reload={query.refetch} />}
      {project.data && (
        <>
          <TimeLogDialog task={task} active={active} reload={query.refetch} />
          <SubmitResultDialog
            task={task}
            active={active}
            reload={query.refetch}
          />
        </>
      )}
    </>
  );
}
