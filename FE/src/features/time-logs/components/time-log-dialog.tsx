"use client";
import type { FormField } from "@/components/forms/form.types";
import { VersionedSchemaForm } from "@/components/forms/versioned-schema-form";
import { HashDialog } from "@/components/ui/dialog";
import { Loading } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { useGetTaskQuery } from "@/features/tasks/hooks/use-tasks-queries";
import { type TaskDto } from "@/features/tasks/types/tasks.types";
import {
  createTimeLogSchema,
  updateTimeLogSchema,
} from "@/features/time-logs/schemas/time-logs.schema";
import { type TimeLogDto } from "@/features/time-logs/types/time-logs.types";
import { useSession } from "@/lib/auth/session-context";
import { changedFields } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { reasonSchema } from "@/lib/validation/common.schema";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateTimeLogMutation,
  useUpdateTimeLogMutation,
  useVoidTimeLogMutation,
} from "../hooks/use-time-logs-mutations";
import { useListTimeLogsQuery } from "../hooks/use-time-logs-queries";

export function TimeLogDialog({ taskId }: { taskId: string }) {
  const dialog = useHashDialog();
  const search = useSearchParams();
  const { session } = useSession();
  const task = useGetTaskQuery(taskId);
  const project = useGetProjectQuery(task.data?.projectId ?? "");
  const logId = search.get("timeLogId");
  const page = Math.max(1, Number(search.get("logPage")) || 1);
  const logs = useListTimeLogsQuery(
    taskId,
    { page },
    { enabled: dialog.name === "time-log" && Boolean(logId) },
  );
  const selected = logs.data?.items.find((l) => l.id === logId);
  return (
    <HashDialog
      name="time-log"
      title={logId ? "Chỉnh sửa hoặc loại giờ công" : "Ghi nhận thời gian"}
      description="Số phút được ghi riêng, không tự suy từ thời gian chạy trạng thái."
    >
      {!task.data ? (
        <Loading />
      ) : task.data.assigneeId !== session?.user.id ||
        task.data.status !== "IN_PROGRESS" ||
        project.data?.status !== "ACTIVE" ? (
        <p>
          Bạn chỉ được ghi hoặc sửa giờ khi đang là người nhận hiện tại và công
          việc đang thực hiện trong dự án hoạt động.
        </p>
      ) : logId && logs.isError ? (
        <QueryErrorState error={logs.error} />
      ) : logId && !logs.data ? (
        <Loading />
      ) : logId &&
        (!selected ||
          selected.userId !== session?.user.id ||
          selected.status === "VOID") ? (
        <p>
          Nhật ký không tồn tại trên trang đã chọn hoặc không còn quyền chỉnh
          sửa.
        </p>
      ) : (
        <LogForm
          key={selected?.id ?? "new"}
          task={task.data}
          log={selected}
          reload={async () =>
            logId
              ? {
                  data: (await logs.refetch()).data?.items.find(
                    (l) => l.id === logId,
                  ),
                }
              : task.refetch()
          }
        />
      )}
    </HashDialog>
  );
}
function LogForm({
  task,
  log,
  reload,
}: {
  task: TaskDto;
  log?: TimeLogDto;
  reload: () => Promise<{
    data?: TaskDto | TimeLogDto;
  }>;
}) {
  const [action, setAction] = useState("EDIT");
  const create = useCreateTimeLogMutation();
  const update = useUpdateTimeLogMutation();
  const remove = useVoidTimeLogMutation();
  const dialog = useHashDialog();
  const router = useRouter();
  const fields: FormField[] =
    action === "VOID"
      ? [
          {
            name: "reason",
            label: "Lý do loại khỏi tổng",
            type: "textarea",
            required: true,
          },
        ]
      : [
          {
            name: "workDate",
            label: "Ngày làm việc (Việt Nam)",
            type: "date",
            required: true,
          },
          { name: "minutes", label: "Số phút", type: "number", required: true },
          {
            name: "description",
            label: "Nội dung thực hiện",
            type: "textarea",
            required: true,
          },
          ...(log
            ? [
                {
                  name: "reason",
                  label: "Lý do chỉnh sửa",
                  type: "textarea" as const,
                  required: true,
                },
              ]
            : []),
        ];
  return (
    <>
      {log && (
        <label>
          Thao tác
          <select
            value={action}
            onChange={(e) => {
              if (confirmDiscard()) setAction(e.target.value);
            }}
          >
            <option value="EDIT">Sửa nhật ký</option>
            <option value="VOID">Loại khỏi tổng</option>
          </select>
        </label>
      )}
      <div className="section-gap">
        <VersionedSchemaForm
          initial={log ?? task}
          reload={reload}
          key={action}
          schema={
            action === "VOID"
              ? reasonSchema
              : log
                ? updateTimeLogSchema
                : createTimeLogSchema
          }
          fields={fields}
          defaults={
            log && action !== "VOID"
              ? {
                  workDate: log.workDate,
                  minutes: log.minutes,
                  description: log.description,
                }
              : {}
          }
          onSubmit={async (values, base) => {
            if (log && "reason" in values) {
              const input = { timeLogId: log.id, version: base.version };
              if (action === "VOID")
                await remove.mutateAsync({
                  ...input,
                  payload: { reason: values.reason },
                });
              else
                await update.mutateAsync({
                  ...input,
                  payload: updateTimeLogSchema.parse({
                    ...changedFields(base, values, [
                      "workDate",
                      "minutes",
                      "description",
                    ]),
                    reason: values.reason,
                  }),
                });
            } else if (!("reason" in values))
              await create.mutateAsync({
                taskId: task.id,
                payload: values,
                version: base.version,
              });
            toast.success(
              action === "VOID"
                ? "Đã loại nhật ký khỏi tổng, vẫn giữ lịch sử."
                : "Đã lưu giờ công.",
            );
            dialog.close();
            router.push(`/tasks/${task.id}/time-logs`);
          }}
          submitLabel={
            action === "VOID" ? "Xác nhận loại khỏi tổng" : "Lưu nhật ký"
          }
        />
      </div>
    </>
  );
}
