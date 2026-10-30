"use client";

import { Form } from "@/components/forms/form";
import { FormMultiSelect, FormTextarea } from "@/components/forms/form-field";
import { ActionButton } from "@/components/ui/action-button";
import { PageSkeleton } from "@/components/ui/loading";
import { Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  reload,
}: {
  report: ReportDto;
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
  const [send, setSend] = useState(false);
  const schema = updateReportSchema
    .extend({
      zeroTimeReason: z
        .string()
        .trim()
        .max(2000)
        .transform((value) => value || null),
    })
    .superRefine((v, ctx) => {
      if (!send) return;
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
    <>
      {preview.isError ? (
        <QueryErrorState error={preview.error} />
      ) : preview.data ? (
        <ReportNumbers
          value={preview.data}
          actions={
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
          }
        />
      ) : (
        <PageSkeleton variant="form" />
      )}
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
          submitLabel={send ? "Lưu và gửi báo cáo" : "Lưu nháp"}
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
            if (send) {
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
            required={send}
            {...form.register("achievements")}
            error={errors.achievements}
          />
          <FormTextarea
            label="Khó khăn"
            {...form.register("blockers")}
            error={errors.blockers}
          />
          <FormTextarea
            label="Kế hoạch tiếp theo"
            required={send}
            {...form.register("nextPlan")}
            error={errors.nextPlan}
          />
          <FormTextarea
            label="Lý do nếu không có giờ công"
            {...form.register("zeroTimeReason")}
            error={errors.zeroTimeReason}
          />
          <label className="checkbox-label wide">
            <input
              type="checkbox"
              checked={send}
              onChange={(e) => setSend(e.target.checked)}
            />
            Gửi và chốt báo cáo sau khi lưu
          </label>
        </Form>
      </Panel>
    </>
  );
}
