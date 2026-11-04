"use client";

import { RecordStamp, stampText } from "@/components/ui/record-stamp";
import { Form } from "@/components/forms/form";
import { FormInput, FormTextarea } from "@/components/forms/form-field";
import { ActionButton } from "@/components/ui/action-button";
import {
  DialogFooter,
  EntityDialog,
  RowDialogLinks,
} from "@/components/ui/entity-dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { DataTable, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { dateTime } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useRunJobMutation,
  useUpdateJobMutation,
} from "../hooks/use-jobs-mutations";
import {
  useListJobRunsQuery,
  useListJobsQuery,
} from "../hooks/use-jobs-queries";
import { updateJobSchema } from "../schemas/job.schema";
import type { BackgroundJobDto, JobRunDto } from "../types/jobs.types";

const statusLabels: Record<string, string> = {
  SUCCEEDED: "Thành công",
  FAILED: "Lỗi",
  RUNNING: "Đang chạy",
};
// Số liệu tổng hợp của GenerateAsync (ADMIN_MODULES 3.2).
const summaryLabels: Record<string, string> = {
  created: "Tạo mới",
  updated: "Cập nhật",
  deactivated: "Hết điều kiện",
};
function JobStatus({ value }: { value: string | null }) {
  if (!value) return <>Chưa chạy</>;
  return (
    <span className={`badge ${value.toLowerCase()}`}>
      {statusLabels[value] ?? value}
    </span>
  );
}

export function JobsPage() {
  const dialog = useEntityDialog();
  const query = useListJobsQuery();
  const run = useRunJobMutation();
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton variant="table" />;
  const selected = query.data.find((job) => job.code === dialog.id);
  return (
    <>
      <PageHeader title="Job nền" />
      <DataTable
        actions
        widths={[22, 9, 8, 12, 12, 9, 12, 16]}
        headers={[
          "Job",
          "Trạng thái",
          "Chu kỳ",
          "Lần chạy cuối",
          "Lần kế tiếp",
          "Kết quả",
          "Cập nhật bởi",
          "Hành động",
        ]}
        rows={query.data.map((job) => [
          <span key="name">
            {job.name}
            {job.description && (
              <span className="small muted"> — {job.description}</span>
            )}
          </span>,
          job.isEnabled ? "Đang bật" : "Đang tắt",
          `${job.intervalMinutes} phút`,
          dateTime(job.lastRunAt),
          dateTime(job.nextRunAt),
          <JobStatus key="status" value={job.lastStatus} />,
          stampText(job.updatedBy, job.updatedAt),
          <span key="actions" className="row-actions">
            <RowDialogLinks
              name={`job ${job.name}`}
              view={dialog.href("view", job.code)}
              edit={dialog.href("edit", job.code)}
            />
            <ActionButton
              pendingLabel="Đang chạy…"
              onAction={async () => {
                const result = await run.mutateAsync(job.code);
                toast.success(
                  result.status === "SUCCEEDED"
                    ? "Đã chạy xong job."
                    : "Job chạy lỗi, xem lịch sử.",
                );
              }}
            >
              Chạy ngay
            </ActionButton>
          </span>,
        ])}
      />
      {dialog.mode && dialog.mode !== "create" && selected && (
        <EntityDialog
          open
          size={dialog.mode === "view" ? "lg" : "md"}
          title={selected.name}
          status={
            <>
              <span>{selected.isEnabled ? "Đang bật" : "Đang tắt"}</span>
              <JobStatus value={selected.lastStatus} />
            </>
          }
          stamp={
            <RecordStamp
              updatedBy={selected.updatedBy}
              updatedAt={selected.updatedAt}
            />
          }
          onClose={dialog.close}
        >
          {dialog.mode === "edit" ? (
            <JobForm
              key={selected.code}
              job={selected}
              reload={async () => {
                const result = await query.refetch();
                return {
                  data: result.data?.find((job) => job.code === selected.code),
                };
              }}
              onCancel={async () => {
                if (await confirmDiscard())
                  dialog.switchTo("view", selected.code);
              }}
              onDone={() => dialog.switchTo("view", selected.code)}
            />
          ) : (
            <>
              <dl className="record-details">
                <div>
                  <dt>Mô tả</dt>
                  <dd>{selected.description ?? "—"}</dd>
                </div>
                <div>
                  <dt>Chu kỳ</dt>
                  <dd>{selected.intervalMinutes} phút</dd>
                </div>
                <div>
                  <dt>Lần chạy cuối</dt>
                  <dd>{dateTime(selected.lastRunAt)}</dd>
                </div>
                <div>
                  <dt>Lần kế tiếp</dt>
                  <dd>{dateTime(selected.nextRunAt)}</dd>
                </div>
              </dl>
              <JobRuns code={selected.code} />
              <DialogFooter>
                <button type="button" onClick={dialog.close}>
                  Đóng
                </button>
                <ActionButton
                  pendingLabel="Đang chạy…"
                  onAction={async () => {
                    await run.mutateAsync(selected.code);
                    toast.success("Đã chạy job.");
                  }}
                >
                  Chạy ngay
                </ActionButton>
                <button
                  type="button"
                  className="primary"
                  onClick={() => dialog.switchTo("edit", selected.code)}
                >
                  Chỉnh sửa
                </button>
              </DialogFooter>
            </>
          )}
        </EntityDialog>
      )}
    </>
  );
}

const jobFormSchema = updateJobSchema.extend({
  isEnabled: z.boolean(),
  intervalMinutes: z.number().int().min(1).max(1440),
});
function JobForm({
  job,
  reload,
  onCancel,
  onDone,
}: {
  job: BackgroundJobDto;
  reload: () => Promise<{ data?: BackgroundJobDto }>;
  onCancel: () => void;
  onDone: () => void;
}) {
  const snapshot = useEditSnapshot(job);
  const update = useUpdateJobMutation();
  const form = useForm<z.input<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema, { error: validationMessage }),
    defaultValues: {
      isEnabled: job.isEnabled,
      intervalMinutes: job.intervalMinutes,
      reason: "",
    },
  });
  const { errors } = form.formState;
  return (
    <Form
      compact
      form={form}
      cancel={
        <button type="button" onClick={onCancel}>
          Hủy
        </button>
      }
      compareFields={[
        { name: "isEnabled", label: "Đang bật" },
        { name: "intervalMinutes", label: "Chu kỳ (phút)" },
      ]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async ({ reason, ...values }) => {
        await update.mutateAsync({
          code: job.code,
          version: snapshot.base.version,
          payload: { ...values, ...(reason ? { reason } : {}) },
        });
        toast.success("Đã lưu cấu hình job.");
        onDone();
      }}
    >
      <label className="checkbox-label form-field field-full">
        <input type="checkbox" {...form.register("isEnabled")} />
        Bật chạy theo lịch
      </label>
      <FormInput
        label="Chu kỳ (phút)"
        type="number"
        min={1}
        max={1440}
        required
        {...form.register("intervalMinutes", { valueAsNumber: true })}
        error={errors.intervalMinutes}
      />
      <FormTextarea
        label="Lý do"
        {...form.register("reason")}
        error={errors.reason}
      />
    </Form>
  );
}

function JobRuns({ code }: { code: string }) {
  const filter = useUrlFilters();
  const page = Math.max(1, Number(filter.get("runsPage")) || 1);
  const query = useListJobRunsQuery(code, { page, pageSize: 20 });
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton variant="table" />;
  return (
    <DataTable
      title={`Lịch sử chạy · ${code}`}
      widths={[18, 10, 12, 16, 24, 20]}
      headers={[
        "Bắt đầu",
        "Thời lượng",
        "Kết quả",
        "Kích hoạt",
        "Tổng hợp",
        "Lỗi",
      ]}
      rows={query.data.items.map((run: JobRunDto) => [
        dateTime(run.startedAt),
        run.durationMs === null
          ? "—"
          : `${(run.durationMs / 1000).toFixed(1)} giây`,
        <JobStatus key="status" value={run.status} />,
        run.trigger === "MANUAL"
          ? `Thủ công · ${run.triggeredBy?.label ?? "—"}`
          : "Theo lịch",
        run.summary
          ? Object.entries(run.summary)
              .map(([key, value]) => `${summaryLabels[key] ?? key}: ${value}`)
              .join(", ")
          : "—",
        run.error ? (
          <details key="error">
            <summary>Xem lỗi</summary>
            <p className="preserve-lines small">{run.error}</p>
          </details>
        ) : (
          "—"
        ),
      ])}
      pagination={{
        ...query.data.pagination,
        onPage: (p) => filter.set("runsPage", String(p)),
      }}
    />
  );
}
