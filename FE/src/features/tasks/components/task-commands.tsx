"use client";
import { VersionedSchemaForm } from "@/components/forms/versioned-schema-form";
import { HashDialog } from "@/components/ui/dialog";
import { Loading } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { assignTaskSchema } from "@/features/tasks/schemas/task-form.schema";
import { type TaskDto } from "@/features/tasks/types/tasks.types";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { reasonSchema } from "@/lib/validation/common.schema";
import { emptySchema } from "@/lib/validation/request.schema";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAssignTaskMutation,
  useCancelTaskMutation,
  usePauseTaskMutation,
  useStartTaskMutation,
} from "../hooks/use-tasks-mutations";
import { useGetTaskQuery } from "../hooks/use-tasks-queries";

export function TaskAssignmentDialog({ task }: { task: TaskDto }) {
  const dialog = useHashDialog();
  const query = useGetTaskQuery(task.id);
  const members = useListProjectMembersQuery(
    task.projectId,
    { pageSize: 100 },
    { enabled: dialog.name === "assignment" },
  );
  const mutation = useAssignTaskMutation();
  return (
    <HashDialog
      name="assignment"
      title={task.assigneeId ? "Bàn giao công việc" : "Giao công việc"}
      description="Giờ công của người trước vẫn được bảo toàn sau khi bàn giao."
    >
      {members.isError ? (
        <QueryErrorState error={members.error} />
      ) : !members.data ? (
        <Loading />
      ) : (
        <VersionedSchemaForm
          initial={task}
          reload={() => query.refetch()}
          schema={assignTaskSchema}
          fields={[
            {
              name: "assigneeId",
              label: "Người nhận mới",
              type: "select",
              required: true,
              options: members.data.items
                .filter((m) => !m.endedAt && m.userId !== task.assigneeId)
                .map((m) => ({ value: m.userId, label: m.user.displayName })),
            },
            {
              name: "reason",
              label: "Lý do bàn giao",
              type: "textarea",
              required: Boolean(task.assigneeId),
              emptyAsUndefined: !task.assigneeId,
            },
          ]}
          onSubmit={async (values, base) => {
            await mutation.mutateAsync({
              taskId: task.id,
              payload: values,
              version: base.version,
            });
            toast.success("Đã phân công công việc.");
            dialog.close();
          }}
          submitLabel="Xác nhận phân công"
        />
      )}
    </HashDialog>
  );
}
export function TaskExecutionDialog({ task }: { task: TaskDto }) {
  const { session } = useSession();
  const query = useGetTaskQuery(task.id);
  const dialog = useHashDialog();
  const start = useStartTaskMutation();
  const pause = usePauseTaskMutation();
  const cancel = useCancelTaskMutation();
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
          onChange={(e) => {
            if (confirmDiscard()) setChoice(e.target.value);
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
        <VersionedSchemaForm
          initial={task}
          reload={() => query.refetch()}
          key={action}
          schema={action === "START" ? emptySchema : reasonSchema}
          fields={
            action === "START"
              ? []
              : [
                  {
                    name: "reason",
                    label: action === "PAUSE" ? "Lý do tạm dừng" : "Lý do hủy",
                    type: "textarea",
                    required: true,
                  },
                ]
          }
          onSubmit={async (values, base) => {
            const input = { taskId: task.id, version: base.version };
            if ("reason" in values) {
              await (action === "PAUSE" ? pause : cancel).mutateAsync({
                ...input,
                payload: { reason: values.reason },
              });
            } else await start.mutateAsync(input);
            toast.success("Đã cập nhật trạng thái.");
            dialog.close();
          }}
          submitLabel="Xác nhận"
        />
      </div>
    </HashDialog>
  );
}
