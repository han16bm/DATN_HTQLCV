"use client";

import { Form } from "@/components/forms/form";
import { FormInput, FormTextarea } from "@/components/forms/form-field";
import { ReasonForm } from "@/components/forms/reason-form";
import { HashDialog } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { type TaskDto } from "@/features/tasks/types/tasks.types";
import { useSession } from "@/lib/auth/session-context";
import { changedFields } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateTimeLogMutation,
  useUpdateTimeLogMutation,
  useVoidTimeLogMutation,
} from "../hooks/use-time-logs-mutations";
import { useListTimeLogsQuery } from "../hooks/use-time-logs-queries";
import {
  createTimeLogSchema,
  updateTimeLogSchema,
} from "../schemas/time-logs.schema";
import { type TimeLogDto } from "../types/time-logs.types";

export function TimeLogDialog({
  task,
  active,
  reload,
}: {
  task: TaskDto;
  active: boolean;
  reload: () => Promise<{ data?: TaskDto }>;
}) {
  const dialog = useHashDialog();
  const search = useSearchParams();
  const { session } = useSession();
  const logId = search.get("timeLogId");
  const page = Math.max(1, Number(search.get("logPage")) || 1);
  const logs = useListTimeLogsQuery(
    task.id,
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
      {task.assigneeId !== session?.user.id ||
      task.status !== "IN_PROGRESS" ||
      !active ? (
        <p>
          Bạn chỉ được ghi hoặc sửa giờ khi đang là người nhận hiện tại và công
          việc đang thực hiện trong dự án hoạt động.
        </p>
      ) : logId && logs.isError ? (
        <QueryErrorState error={logs.error} />
      ) : logId && !logs.data ? (
        <PageSkeleton variant="form" />
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
          task={task}
          log={selected}
          reload={async () =>
            logId
              ? {
                  data: (await logs.refetch()).data?.items.find(
                    (l) => l.id === logId,
                  ),
                }
              : reload()
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
  reload: () => Promise<{ data?: TaskDto | TimeLogDto }>;
}) {
  const [action, setAction] = useState("EDIT");
  const remove = useVoidTimeLogMutation();
  const snapshot = useEditSnapshot(log ?? task);
  const dialog = useHashDialog();
  const router = useRouter();
  function done(message: string) {
    toast.success(message);
    dialog.close();
    router.push(`/tasks/${task.id}/time-logs`);
  }
  return (
    <>
      {log && (
        <label>
          Thao tác
          <select
            value={action}
            onChange={async (event) => {
              const value = event.target.value;
              if (await confirmDiscard()) setAction(value);
            }}
          >
            <option value="EDIT">Sửa nhật ký</option>
            <option value="VOID">Loại khỏi tổng</option>
          </select>
        </label>
      )}
      <div className="section-gap">
        {action === "VOID" && log ? (
          <ReasonForm
            label="Lý do loại khỏi tổng"
            submitLabel="Xác nhận loại khỏi tổng"
            onConflictReload={() => snapshot.load(reload)}
            onConflictAccept={snapshot.accept}
            onSubmit={async (payload) => {
              await remove.mutateAsync({
                timeLogId: log.id,
                payload,
                version: snapshot.base.version,
              });
              done("Đã loại nhật ký khỏi tổng, vẫn giữ lịch sử.");
            }}
          />
        ) : (
          <LogEditor
            key={action}
            task={task}
            log={log}
            reload={reload}
            onSaved={() => done("Đã lưu giờ công.")}
          />
        )}
      </div>
    </>
  );
}

function LogEditor({
  task,
  log,
  reload,
  onSaved,
}: {
  task: TaskDto;
  log?: TimeLogDto;
  reload: () => Promise<{ data?: TaskDto | TimeLogDto }>;
  onSaved: () => void;
}) {
  const create = useCreateTimeLogMutation();
  const update = useUpdateTimeLogMutation();
  const snapshot = useEditSnapshot(log ?? task);
  const schema = createTimeLogSchema.extend({
    reason: log ? updateTimeLogSchema.shape.reason : z.string(),
  });
  const form = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema, { error: validationMessage }),
    defaultValues: {
      workDate: log?.workDate ?? "",
      minutes: log?.minutes,
      description: log?.description ?? "",
      reason: "",
    },
  });
  const { errors } = form.formState;
  return (
    <Form
      compact={!log}
      form={form}
      submitLabel="Lưu nhật ký"
      compareFields={[
        { name: "workDate", label: "Ngày làm việc" },
        { name: "minutes", label: "Số phút" },
        { name: "description", label: "Nội dung thực hiện" },
      ]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async ({ reason, ...values }) => {
        const base = snapshot.base;
        if (log)
          await update.mutateAsync({
            timeLogId: log.id,
            payload: {
              ...changedFields(base, values, [
                "workDate",
                "minutes",
                "description",
              ]),
              reason,
            },
            version: base.version,
          });
        else
          await create.mutateAsync({
            taskId: task.id,
            payload: values,
            version: base.version,
          });
        onSaved();
      }}
    >
      <FormInput
        label="Ngày làm việc (Việt Nam)"
        type="date"
        required
        {...form.register("workDate")}
        error={errors.workDate}
      />
      <FormInput
        label="Số phút"
        type="number"
        required
        {...form.register("minutes", { valueAsNumber: true })}
        error={errors.minutes}
      />
      <FormTextarea
        label="Nội dung thực hiện"
        required
        {...form.register("description")}
        error={errors.description}
      />
      {log && (
        <FormTextarea
          label="Lý do chỉnh sửa"
          required
          {...form.register("reason")}
          error={errors.reason}
        />
      )}
    </Form>
  );
}
