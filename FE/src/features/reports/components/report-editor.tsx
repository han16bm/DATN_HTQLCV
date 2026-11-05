"use client";

import { Form } from "@/components/forms/form";
import { SplitLayout } from "@/components/patterns/split-layout";
import { Button } from "@/components/ui/button";
import { FormMultiSelect, FormTextarea } from "@/components/forms/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { PageSkeleton, Spinner } from "@/components/ui/loading";
import { Panel } from "@/components/ui/page";
import { UserBadge } from "@/components/ui/user-badge";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { changedFields, dateTime, hours, label } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useRefreshReportDraftMutation,
  useSubmitReportMutation,
  useUpdateReportDraftMutation,
} from "../hooks/use-reports-mutations";
import { useGetReportPreviewQuery } from "../hooks/use-reports-queries";
import { updateReportSchema } from "../schemas/reports.schema";
import { type ReportDto } from "../types/reports.types";
import { ReportNumbers } from "./report-numbers";
export function ReportEditor({
  report,
  projectName,
  reload,
}: {
  report: ReportDto;
  projectName: string;
  reload: () => Promise<{
    data?: ReportDto;
  }>;
}) {
  const preview = useGetReportPreviewQuery({
    projectId: report.projectId,
    periodType: report.periodType,
    periodStart: report.periodStart,
  });
  const update = useUpdateReportDraftMutation();
  const refresh = useRefreshReportDraftMutation();
  const submit = useSubmitReportMutation();
  const snapshot = useEditSnapshot(report);
  const router = useRouter();
  const send = useRef(false);
  const schema = updateReportSchema
    .extend({
      zeroTimeReason: z
        .string()
        .trim()
        .max(2000)
        .transform((value) => value || null),
    })
    .superRefine((v, ctx) => {
      if (!send.current) return;
      if (!v.achievements?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["achievements"],
          message: "Kết quả thực hiện là bắt buộc khi gửi.",
        });
      if (!v.nextPlan?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["nextPlan"],
          message: "Kế hoạch tiếp theo là bắt buộc khi gửi.",
        });
      if (preview.data?.totalMinutes === 0 && !v.zeroTimeReason?.trim())
        ctx.addIssue({
          code: "custom",
          path: ["zeroTimeReason"],
          message: "Cần giải thích kỳ không có giờ công.",
        });
    });
  const form = useForm<
    z.input<typeof schema>,
    unknown,
    z.output<typeof schema>
  >({
    resolver: zodResolver(schema, { error: validationMessage }),
    defaultValues: {
      achievements: report.achievements,
      blockers: report.blockers,
      nextPlan: report.nextPlan,
      selectedTaskIds: report.selectedTaskIds,
      zeroTimeReason: report.zeroTimeReason ?? "",
    },
  });
  const { errors } = form.formState;
  return (
    <SplitLayout
      aside={
        <aside aria-label="Thông tin kỳ báo cáo" className="grid gap-3">
          <Panel title="Kỳ báo cáo">
            <dl className="m-0 grid gap-y-2 text-sm [&>div]:grid [&>div]:grid-cols-[7rem_minmax(0,1fr)] [&>div]:items-baseline [&>div]:gap-x-3 [&_dt]:text-fg-subtle [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:text-left [&_dd]:break-words">
              <div>
                <dt>Dự án</dt>
                <dd>{projectName}</dd>
              </div>
              <div>
                <dt>Người lập</dt>
                <dd>
                  <UserBadge name={report.author.displayName} />
                </dd>
              </div>
              <div>
                <dt>Loại báo cáo</dt>
                <dd>{label(report.periodType)}</dd>
              </div>
              <div>
                <dt>Bắt đầu kỳ</dt>
                <dd>{report.periodStart.split("-").reverse().join("/")}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Số liệu nguồn">
            {preview.isError ? (
              <QueryErrorState error={preview.error} retry={preview.refetch} />
            ) : !preview.data ? (
              <PageSkeleton variant="cards" />
            ) : (
              <>
                <dl className="m-0 grid gap-y-2 text-sm [&>div]:grid [&>div]:grid-cols-[7rem_minmax(0,1fr)] [&>div]:items-baseline [&>div]:gap-x-3 [&_dt]:text-fg-subtle [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:text-left [&_dd]:break-words">
                  <div>
                    <dt>Giờ công</dt>
                    <dd>{hours(preview.data.totalMinutes)}</dd>
                  </div>
                  <div>
                    <dt>Công việc</dt>
                    <dd>{preview.data.items.length} việc</dd>
                  </div>
                  <div>
                    <dt>Cập nhật</dt>
                    <dd>{dateTime(preview.data.dataAsOf)}</dd>
                  </div>
                </dl>
                {preview.data.partialPeriod && (
                  <p className="text-xs text-fg-subtle">
                    Kỳ báo cáo chưa kết thúc.
                  </p>
                )}
                <ActionButton
                  onAction={async () => {
                    await refresh.mutateAsync({
                      reportId: report.id,
                      version: snapshot.base.version,
                    });
                  }}
                >
                  Làm mới số liệu
                </ActionButton>
              </>
            )}
          </Panel>
        </aside>
      }
    >
      <Panel title="Nội dung báo cáo">
        <Form
          form={form}
          compareFields={[
            {
              name: "selectedTaskIds",
              label: "Công việc trong báo cáo",
              options:
                preview.data?.items.map((t) => ({
                  value: t.taskId,
                  label: t.title,
                })) ?? [],
            },
            { name: "achievements", label: "Kết quả thực hiện" },
            { name: "blockers", label: "Khó khăn" },
            { name: "nextPlan", label: "Kế hoạch tiếp theo" },
            { name: "zeroTimeReason", label: "Lý do nếu không có giờ công" },
          ]}
          submitActions={
            <>
              <Button
                type="submit"
                className="inline-flex items-center gap-2"
                onClick={() => {
                  send.current = false;
                }}
              >
                {form.formState.isSubmitting && !send.current && <Spinner />}
                Lưu nháp
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!preview.data}
                className="inline-flex items-center gap-2"
                aria-busy={form.formState.isSubmitting}
                onClick={() => {
                  send.current = true;
                }}
              >
                {form.formState.isSubmitting && send.current && <Spinner />}
                Gửi báo cáo
              </Button>
            </>
          }
          onConflictReload={() => snapshot.load(reload)}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            const patch = changedFields(snapshot.base, values, [
              "achievements",
              "blockers",
              "nextPlan",
              "selectedTaskIds",
              "zeroTimeReason",
            ]);
            let saved = snapshot.base;
            if (Object.keys(patch).length) {
              saved = await update.mutateAsync({
                reportId: report.id,
                payload: patch,
                version: saved.version,
              });
              snapshot.saved(saved);
            }
            if (send.current) {
              await submit.mutateAsync({
                reportId: report.id,
                payload: values.zeroTimeReason
                  ? { zeroTimeReason: values.zeroTimeReason }
                  : {},
                version: saved.version,
              });
              toast.success("Đã gửi và chốt báo cáo.");
              router.push(`/reports/${report.id}`);
            } else toast.success("Đã lưu bản nháp.");
          }}
        >
          <Controller
            name="selectedTaskIds"
            control={form.control}
            render={({ field }) => (
              <FormMultiSelect
                label="Công việc trong báo cáo"
                options={
                  preview.data?.items.map((t) => ({
                    value: t.taskId,
                    label: t.title,
                  })) ?? []
                }
                {...field}
                value={field.value ?? []}
                error={errors.selectedTaskIds}
              />
            )}
          />
          <FormTextarea
            label="Kết quả thực hiện"
            required
            hint="Bắt buộc khi gửi báo cáo."
            {...form.register("achievements")}
            error={errors.achievements}
          />
          <FormTextarea
            label="Khó khăn"
            width="medium"
            {...form.register("blockers")}
            error={errors.blockers}
          />
          <FormTextarea
            label="Kế hoạch tiếp theo"
            required
            width="medium"
            hint="Bắt buộc khi gửi báo cáo."
            {...form.register("nextPlan")}
            error={errors.nextPlan}
          />
          {(preview.data?.totalMinutes === 0 || report.zeroTimeReason) && (
            <FormTextarea
              label="Lý do nếu không có giờ công"
              {...form.register("zeroTimeReason")}
              error={errors.zeroTimeReason}
            />
          )}
          {preview.data && (
            <details className="col-span-full pt-1">
              <summary className="cursor-pointer py-2 text-sm font-medium text-selected-fg">
                Công việc và giờ công trong kỳ
              </summary>
              <ReportNumbers value={preview.data} />
            </details>
          )}
        </Form>
      </Panel>
    </SplitLayout>
  );
}
