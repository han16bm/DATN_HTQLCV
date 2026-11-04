"use client";
import { SplitLayout } from "@/components/patterns/split-layout";

import { Form } from "@/components/forms/form";
import { FormInput } from "@/components/forms/form-field";
import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/loading";
import { Panel, linkClass } from "@/components/ui/page";
import { PanelLink } from "@/components/ui/panel-link";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { SlidePanel } from "@/components/ui/slide-panel";
import { UserBadge } from "@/components/ui/user-badge";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { SubmissionPreview } from "@/features/submissions/components/submission-detail-page";
import { SubmissionsPage } from "@/features/submissions/components/submissions-page";
import { TimeLogsTable } from "@/features/time-logs/components/time-logs-page";
import { useSession } from "@/lib/auth/session-context";
import { cn } from "@/lib/cn";
import { dateTime, eventLabel, hours } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useUpdateRemainingEstimateMutation } from "../hooks/use-tasks-mutations";
import {
  useGetTaskQuery,
  useListTaskHistoryQuery,
} from "../hooks/use-tasks-queries";
import { remainingSchema } from "../schemas/task-form.schema";
import type { TaskDto } from "../types/tasks.types";
import { TaskHistoryTable } from "./task-history-page";

// Nội dung/tiêu chí gọn ở đầu, bảng các lần nộp ở dưới, phân công và giờ công ở cột phụ.
// Chỉ mở ngăn kéo và tải nội dung/tài liệu sau khi chọn Chi tiết một lần nộp.
export function TaskDetailPage({ taskId }: { taskId: string }) {
  const dialog = useHashDialog();
  const [logPage, setLogPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const query = useGetTaskQuery(taskId);
  const history = useListTaskHistoryQuery(taskId, { pageSize: 5 });
  const project = useGetProjectQuery(query.data?.projectId ?? "");
  const { session } = useSession();
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton />;
  const task = query.data;
  const submissionId = detailId ?? task.latestSubmissionId;
  const close = (open: boolean) => {
    if (!open) dialog.close();
  };
  const inspector = (
    <aside
      aria-label="Thông tin công việc"
      className="grid gap-5"
    >
      <Panel title="Phân công và thời hạn" compact>
        <KeyValueList compact>
          <KeyValue label="Người thực hiện">
            {task.assignee ? (
              <UserBadge
                name={task.assignee.displayName}
                href={`/users/${encodeURIComponent(task.assignee.id)}`}
              />
            ) : (
              "Chưa phân công"
            )}
          </KeyValue>
          <KeyValue label="Dự án">
            <Link
              className={linkClass}
              href={`/projects/${encodeURIComponent(task.projectId)}`}
            >
              {task.project.name}
            </Link>
          </KeyValue>
          <KeyValue label="Hạn hoàn thành">
            <span
              className={cn(task.isOverdue && "font-medium text-danger-fg")}
            >
              {dateTime(task.dueAt)}
            </span>
          </KeyValue>
        </KeyValueList>
        <details className="border-t border-line pt-2">
          <summary className="cursor-pointer text-xs font-medium text-fg-subtle">
            Các mốc thời gian
          </summary>
          <div className="mt-2">
            <KeyValueList compact>
              <KeyValue label="Ngày tạo">{dateTime(task.createdAt)}</KeyValue>
              <KeyValue label="Bắt đầu thực hiện">
                {task.firstStartedAt
                  ? dateTime(task.firstStartedAt)
                  : "Chưa bắt đầu"}
              </KeyValue>
              <KeyValue label="Hạn ban đầu">
                {dateTime(task.originalDueAt)}
              </KeyValue>
            </KeyValueList>
          </div>
        </details>
      </Panel>
      <Panel
        title="Giờ công"
        compact
        actions={
          <PanelLink onClick={() => dialog.open("time-logs")}>
            Nhật ký
          </PanelLink>
        }
      >
        <KeyValueList compact>
          <KeyValue label="Đã thực hiện">
            <span className="font-semibold tabular-nums">
              {hours(task.actualMinutes)}
            </span>
          </KeyValue>
          <KeyValue label="Ước lượng hiện tại">
            <span className="tabular-nums">
              {hours(task.estimatedMinutes)}
            </span>
          </KeyValue>
          <KeyValue label="Ước lượng ban đầu">
            {hours(task.originalEstimatedMinutes)}
          </KeyValue>
          <KeyValue label="Thời gian còn lại">
            {task.remainingMinutes === null
              ? "Chưa cập nhật"
              : hours(task.remainingMinutes)}
          </KeyValue>
        </KeyValueList>
        {task.assigneeId === session?.user.id &&
          task.status === "IN_PROGRESS" &&
          project.data?.status === "ACTIVE" && (
            <RemainingForm
              key={task.id}
              task={task}
              reload={() => query.refetch()}
            />
          )}
      </Panel>
      <Panel
        title="Hoạt động gần đây"
        compact
        actions={
          <PanelLink onClick={() => dialog.open("history")}>Lịch sử</PanelLink>
        }
      >
        {history.isError ? (
          <QueryErrorState error={history.error} retry={history.refetch} />
        ) : !history.data ? (
          <p className="m-0 text-sm text-fg-subtle">Đang tải…</p>
        ) : history.data.items.length === 0 ? (
          <p className="m-0 text-sm text-fg-subtle">Chưa có hoạt động nào.</p>
        ) : (
          <ol className="m-0 grid list-none gap-3 p-0">
            {history.data.items.slice(0, 3).map((item) => (
              <li key={item.id} className="grid text-sm">
                <span className="font-medium text-fg">
                  {eventLabel(item.action)}
                </span>
                <span className="text-xs text-fg-subtle">
                  {item.actor.displayName} · {dateTime(item.at)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </aside>
  );
  return (
    <>
      <SplitLayout aside={inspector}>
        <section
          aria-label="Nội dung và tiêu chí"
          className="@container/task-content"
        >
          <div className="grid divide-y divide-line rounded-lg bg-sunken/60 @min-[600px]/task-content:grid-cols-2 @min-[600px]/task-content:divide-x @min-[600px]/task-content:divide-y-0">
            <section className="min-w-0 p-4">
              <h2 className="m-0 mb-2 text-sm font-semibold text-fg">
                Nội dung công việc
              </h2>
              <p className="m-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-fg">
                {task.description || "Chưa có mô tả bổ sung."}
              </p>
            </section>
            <section className="min-w-0 p-4">
              <h2 className="m-0 mb-2 text-sm font-semibold text-fg">
                Tiêu chí nghiệm thu
              </h2>
              <p className="m-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-fg">
                {task.acceptanceCriteria}
              </p>
            </section>
          </div>
        </section>
        <SubmissionsPage
          taskId={task.id}
          onDetail={(id) => {
            setDetailId(id);
            dialog.open("submission");
          }}
        />
      </SplitLayout>
      <SlidePanel
        size="lg"
        open={dialog.name === "time-logs"}
        onOpenChange={close}
        title="Nhật ký giờ công"
        description={`Tổng giờ công hợp lệ: ${hours(task.actualMinutes)}`}
        closeLabel="Đóng nhật ký giờ công"
      >
        <TimeLogsTable
          taskId={task.id}
          page={logPage}
          onPage={setLogPage}
          onEdit={() => dialog.close()}
        />
      </SlidePanel>
      <SlidePanel
        size="lg"
        open={dialog.name === "history"}
        onOpenChange={close}
        title="Lịch sử công việc"
        closeLabel="Đóng lịch sử công việc"
      >
        <TaskHistoryTable
          taskId={task.id}
          page={historyPage}
          onPage={setHistoryPage}
        />
      </SlidePanel>
      <SlidePanel
        size="lg"
        open={dialog.name === "submission" && Boolean(submissionId)}
        onOpenChange={close}
        title="Chi tiết lần nộp"
        closeLabel="Đóng chi tiết lần nộp"
      >
        {submissionId && (
          <SubmissionPreview
            key={submissionId}
            taskId={task.id}
            submissionId={submissionId}
          />
        )}
      </SlidePanel>
    </>
  );
}

function RemainingForm({
  task,
  reload,
}: {
  task: TaskDto;
  reload: () => Promise<{
    data?: TaskDto;
  }>;
}) {
  const mutation = useUpdateRemainingEstimateMutation();
  const snapshot = useEditSnapshot(task);
  const [open, setOpen] = useState(false);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ cập nhật thời gian chưa lưu?"))) return;
    setOpen(false);
  };
  const form = useForm<z.input<typeof remainingSchema>>({
    resolver: zodResolver(remainingSchema, { error: validationMessage }),
    defaultValues: { remainingMinutes: task.remainingMinutes ?? undefined },
  });
  const { errors } = form.formState;
  return (
    <div className="border-t border-line pt-3">
      {open ? (
        <Form
          compact
          form={form}
          compareFields={[
            { name: "remainingMinutes", label: "Còn lại (phút)" },
          ]}
          cancel={<Button onClick={cancel}>Hủy</Button>}
          onConflictReload={() => snapshot.load(reload)}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            snapshot.saved(
              await mutation.mutateAsync({
                taskId: task.id,
                payload: values,
                version: snapshot.base.version,
              }),
            );
            toast.success("Đã cập nhật phút còn lại.");
            setOpen(false);
          }}
          submitLabel="Lưu cập nhật"
        >
          <FormInput
            label="Còn lại (phút)"
            required
            type="number"
            width="full"
            {...form.register("remainingMinutes", { valueAsNumber: true })}
            error={errors.remainingMinutes}
          />
        </Form>
      ) : (
        <Button
          onClick={() => {
            snapshot.saved(task);
            form.reset({
              remainingMinutes: task.remainingMinutes ?? undefined,
            });
            setOpen(true);
          }}
        >
          Cập nhật thời gian còn lại
        </Button>
      )}
    </div>
  );
}
