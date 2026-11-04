"use client";
import { hasPermission } from "@/lib/auth/access";

import { PageSkeleton } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { MenuContent, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { PageHeader, StatusField } from "@/components/ui/page";
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
    return <QueryErrorState error={query.error} retry={query.refetch} />;
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
  return (
    <>
      <div className="pt-2">
        <PageHeader
          title={task.title}
          status={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <StatusField value={task.status} />
              <StatusField label="Ưu tiên" value={task.priority} />
              {task.isOverdue && (
                <StatusField label="Tiến độ" value="OVERDUE" />
              )}
            </div>
          }
          actions={
            <>
              {review && (
                <Button variant="primary" onClick={() => dialog.open("review")}>
                  Quyết định nghiệm thu
                </Button>
              )}
              {working && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => dialog.open("submit")}
                  >
                    Nộp kết quả
                  </Button>
                  <Button onClick={() => dialog.open("time-log")}>
                    Ghi giờ công
                  </Button>
                </>
              )}
              {start && (
                <Button
                  variant="primary"
                  onClick={() => dialog.open("execution")}
                >
                  Bắt đầu
                </Button>
              )}
              {assign && (
                <Button
                  variant="primary"
                  onClick={() => dialog.open("assignment")}
                >
                  Giao việc
                </Button>
              )}
              {(working || change || stop) && (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <IconButton
                      label="Thao tác công việc"
                      className="border border-line-input"
                    >
                      <Ellipsis className="size-[18px]" aria-hidden="true" />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <MenuContent>
                    {working && (
                      <MenuItem onSelect={() => dialog.open("attachment")}>
                        Tải minh chứng
                      </MenuItem>
                    )}
                    {change && (
                      <>
                        {path !== `${root}/edit` && (
                          <MenuItem asChild>
                            <Link href={`${root}/edit`}>Điều chỉnh</Link>
                          </MenuItem>
                        )}
                        {!assign && (
                          <MenuItem onSelect={() => dialog.open("assignment")}>
                            Bàn giao
                          </MenuItem>
                        )}
                      </>
                    )}
                    {stop && (
                      <>
                        {(working || change) && <MenuSeparator />}
                        <MenuItem
                          tone="danger"
                          onSelect={() => dialog.open("execution")}
                        >
                          {working ? "Tạm dừng / hủy" : "Hủy công việc"}
                        </MenuItem>
                      </>
                    )}
                  </MenuContent>
                </DropdownMenu.Root>
              )}
            </>
          }
        />
      </div>

      {project.isError && (
        <QueryErrorState error={project.error} retry={project.refetch} />
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
