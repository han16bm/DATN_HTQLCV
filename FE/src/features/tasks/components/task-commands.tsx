"use client";
import { hasPermission } from "@/lib/auth/access";

import { Form } from "@/components/forms/form";
import { FormSelect, FormTextarea } from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { HashDialog } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { useSession } from "@/lib/auth/session-context";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { reasonSchema } from "@/lib/validation/common.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useAssignTaskMutation,
  useCancelTaskMutation,
  usePauseTaskMutation,
  useStartTaskMutation,
} from "../hooks/use-tasks-mutations";
import { assignTaskSchema } from "../schemas/task-form.schema";
import { type TaskDto } from "../types/tasks.types";
type TaskDialogProps = {
  task: TaskDto;
  reload: () => Promise<{ data?: TaskDto }>;
};
export function TaskAssignmentDialog({ task, reload }: TaskDialogProps) {
  const dialog = useHashDialog();
  const members = useListProjectMembersQuery(
    task.projectId,
    { pageSize: 100 },
    { enabled: dialog.name === "assignment" },
  );
  return (
    <HashDialog
      name="assignment"
      title={task.assigneeId ? "Bàn giao công việc" : "Giao công việc"}
      description="Giờ công của người trước vẫn được bảo toàn sau khi bàn giao."
    >
      {members.isError ? (
        <QueryErrorState error={members.error} />
      ) : !members.data ? (
        <PageSkeleton variant="form" />
      ) : (
        <AssignmentForm
          task={task}
          reload={reload}
          people={members.data.items
            .filter((m) => !m.endedAt && m.userId !== task.assigneeId)
            .map((m) => ({ value: m.userId, label: m.user.displayName }))}
        />
      )}
    </HashDialog>
  );
}

function AssignmentForm({
  task,
  reload,
  people,
}: TaskDialogProps & { people: FormOption[] }) {
  const mutation = useAssignTaskMutation();
  const dialog = useHashDialog();
  const snapshot = useEditSnapshot(task);
  const schema = assignTaskSchema.extend({
    reason: task.assigneeId
      ? reasonSchema.shape.reason
      : z.string().trim().max(2000),
  });
  const form = useForm({
    resolver: zodResolver(schema, { error: validationMessage }),
    defaultValues: { assigneeId: "", reason: "" },
  });
  return (
    <Form
      compact
      form={form}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      compareFields={[
        { name: "assigneeId", label: "Người nhận", options: people },
      ]}
      onSubmit={async ({ assigneeId, reason }) => {
        await mutation.mutateAsync({
          taskId: task.id,
          payload: { assigneeId, ...(reason ? { reason } : {}) },
          version: snapshot.base.version,
        });
        toast.success("Đã phân công công việc.");
        dialog.close();
      }}
      submitLabel="Xác nhận phân công"
    >
      <FormSelect
        label="Người nhận mới"
        required
        options={people}
        {...form.register("assigneeId")}
        error={form.formState.errors.assigneeId}
      />
      <FormTextarea
        label="Lý do bàn giao"
        required={Boolean(task.assigneeId)}
        {...form.register("reason")}
        error={form.formState.errors.reason}
      />
    </Form>
  );
}

export function TaskExecutionDialog({ task, reload }: TaskDialogProps) {
  const { session } = useSession();
  const [choice, setChoice] = useState("");
  const actions = [
    ...(task.assigneeId === session?.user.id && task.status === "TODO"
      ? [{ value: "START", label: "Bắt đầu công việc" }]
      : []),
    ...(task.assigneeId === session?.user.id && task.status === "IN_PROGRESS"
      ? [{ value: "PAUSE", label: "Tạm dừng công việc" }]
      : []),
    ...(hasPermission(session, "TASKS_MANAGE", task.projectId)
      ? [{ value: "CANCEL", label: "Hủy công việc" }]
      : []),
  ];
  if (!actions.length) return null;
  const action = actions.some((a) => a.value === choice)
    ? choice
    : actions[0].value;
  return (
    <HashDialog name="execution" title="Thực hiện hoặc dừng công việc">
      <label>
        Thao tác
        <select
          value={action}
          onChange={async (e) => {
            const value = e.target.value;
            if (await confirmDiscard()) setChoice(value);
          }}
        >
          {actions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      <div className="section-gap">
        <ExecutionForm
          key={action}
          action={action}
          task={task}
          reload={reload}
        />
      </div>
    </HashDialog>
  );
}

function ExecutionForm({
  action,
  task,
  reload,
}: TaskDialogProps & { action: string }) {
  const start = useStartTaskMutation();
  const pause = usePauseTaskMutation();
  const cancel = useCancelTaskMutation();
  const dialog = useHashDialog();
  const snapshot = useEditSnapshot(task);
  const schema = reasonSchema.extend({
    reason: action === "START" ? z.string() : reasonSchema.shape.reason,
  });
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema, { error: validationMessage }),
    defaultValues: { reason: "" },
  });
  const { errors } = form.formState;
  return (
    <Form
      compact
      form={form}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async (values) => {
        const input = { taskId: task.id, version: snapshot.base.version };
        if (action !== "START") {
          await (action === "PAUSE" ? pause : cancel).mutateAsync({
            ...input,
            payload: { reason: values.reason },
          });
        } else await start.mutateAsync(input);
        toast.success("Đã cập nhật trạng thái.");
        dialog.close();
      }}
      submitLabel="Xác nhận"
    >
      {action !== "START" && (
        <FormTextarea
          label={action === "PAUSE" ? "Lý do tạm dừng" : "Lý do hủy"}
          required
          {...form.register("reason")}
          error={errors.reason}
        />
      )}
    </Form>
  );
}
