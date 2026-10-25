"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { ActionButton } from "@/components/ui/action-button";
import { Panel } from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { ReportNumbers } from "@/features/reports/components/report-numbers";
import {
  reportSubmitSchema,
  updateReportSchema,
} from "@/features/reports/schemas/reports.schema";
import { type ReportDto } from "@/features/reports/types/reports.types";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  useRefreshReportDraftMutation,
  useSubmitReportMutation,
  useUpdateReportDraftMutation,
} from "../hooks/use-reports-mutations";
import { useGetReportPreviewQuery } from "../hooks/use-reports-queries";
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
                  version: snapshot.base!.version,
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
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={send}
            onChange={(e) => setSend(e.target.checked)}
          />
          Gửi và chốt báo cáo sau khi lưu
        </label>
        <SchemaForm
          schema={
            send
              ? updateReportSchema.superRefine((v, ctx) => {
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
                  if (
                    preview.data?.totalMinutes === 0 &&
                    !v.zeroTimeReason?.trim()
                  )
                    ctx.addIssue({
                      code: "custom",
                      path: ["zeroTimeReason"],
                      message: "Cần giải thích kỳ không có giờ công.",
                    });
                })
              : updateReportSchema
          }
          defaults={{
            achievements: report.achievements,
            blockers: report.blockers,
            nextPlan: report.nextPlan,
            selectedTaskIds: report.selectedTaskIds,
            zeroTimeReason: report.zeroTimeReason ?? "",
          }}
          fields={[
            {
              name: "selectedTaskIds",
              label: "Công việc trong báo cáo",
              type: "multi",
              options:
                preview.data?.items.map((t) => ({
                  value: t.taskId,
                  label: t.title,
                })) ?? [],
            },
            {
              name: "achievements",
              label: "Kết quả thực hiện",
              type: "textarea",
              required: send,
            },
            { name: "blockers", label: "Khó khăn", type: "textarea" },
            {
              name: "nextPlan",
              label: "Kế hoạch tiếp theo",
              type: "textarea",
              required: send,
            },
            {
              name: "zeroTimeReason",
              label: "Lý do nếu không có giờ công",
              type: "textarea",
              nullable: true,
            },
          ]}
          submitLabel={send ? "Lưu và gửi báo cáo" : "Lưu nháp"}
          onConflictReload={() => snapshot.load(reload)}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            const patch = changedFields(snapshot.base!, values, [
              "achievements",
              "blockers",
              "nextPlan",
              "selectedTaskIds",
              "zeroTimeReason",
            ]);
            let saved = snapshot.base!;
            if (Object.keys(patch).length) {
              saved = await update.mutateAsync({
                reportId: report.id,
                payload: updateReportSchema.parse(patch),
                version: saved.version,
              });
              snapshot.saved(saved);
            }
            if (send) {
              await submit.mutateAsync({
                reportId: report.id,
                payload: reportSubmitSchema.parse(
                  values.zeroTimeReason
                    ? { zeroTimeReason: values.zeroTimeReason }
                    : {},
                ),
                version: saved.version,
              });
              toast.success("Đã gửi và chốt báo cáo.");
              router.push(`/reports/${report.id}`);
            } else toast.success("Đã lưu bản nháp.");
          }}
        />
      </Panel>
    </>
  );
}
