"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { Panel } from "@/components/ui/page";
import { updateAlertSchema } from "@/features/alerts/schemas/alerts.schema";
import { type AlertDto } from "@/features/alerts/types/alerts.types";
import { options } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateAlertMutation } from "../hooks/use-alerts-mutations";
export function AlertForm({
  value,
  reload,
}: {
  value: AlertDto;
  reload: () => Promise<{
    data?: AlertDto;
  }>;
}) {
  const mutation = useUpdateAlertMutation();
  const snapshot = useEditSnapshot(value);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ cập nhật cảnh báo chưa lưu?"))) return;
    setOpen(false);
  };
  return (
    <Panel title="Cập nhật tình trạng xử lý">
      {open ? (
        <SchemaForm
          cancel={
            <button type="button" onClick={cancel}>
              Hủy
            </button>
          }
          schema={updateAlertSchema.superRefine((v, ctx) => {
            if (v.status !== "READ" && !v.resolutionNote?.trim())
              ctx.addIssue({
                code: "custom",
                path: ["resolutionNote"],
                message: "Cần hướng xử lý hoặc lý do cho trạng thái này.",
              });
          })}
          fields={[
            {
              name: "status",
              label: "Trạng thái xử lý",
              type: "select",
              required: true,
              options: options([
                "READ",
                "IN_PROGRESS",
                "RESOLVED",
                "DISMISSED",
              ]),
            },
            {
              name: "resolutionNote",
              label: "Hướng xử lý hoặc lý do",
              type: "textarea",
              emptyAsUndefined: true,
              hint: "Bắt buộc trừ khi chỉ đánh dấu đã đọc.",
            },
          ]}
          defaults={{
            status: value.status === "UNREAD" ? "READ" : value.status,
            resolutionNote: value.resolutionNote ?? "",
          }}
          onConflictReload={() => snapshot.load(reload)}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            await mutation.mutateAsync({
              alertId: value.id,
              payload: values,
              version: snapshot.base!.version,
            });
            toast.success("Đã ghi nhận xử lý cảnh báo.");
            router.push("/alerts");
          }}
        />
      ) : (
        <button type="button" onClick={() => setOpen(true)}>
          Cập nhật xử lý
        </button>
      )}
      <p className="small muted">
        Lưu xử lý cảnh báo không tự đổi trạng thái hoặc kế hoạch công việc.
      </p>
    </Panel>
  );
}
