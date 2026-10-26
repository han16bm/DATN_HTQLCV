"use client";

import { Form } from "@/components/forms/form";
import { FormSelect, FormTextarea } from "@/components/forms/form-field";
import { Panel } from "@/components/ui/page";
import { options } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useUpdateAlertMutation } from "../hooks/use-alerts-mutations";
import { updateAlertSchema } from "../schemas/alerts.schema";
import { type AlertDto } from "../types/alerts.types";
const schema = updateAlertSchema.superRefine((value, ctx) => {
  if (value.status !== "READ" && !value.resolutionNote?.trim())
    ctx.addIssue({
      code: "custom",
      path: ["resolutionNote"],
      message: "Cần hướng xử lý hoặc lý do cho trạng thái này.",
    });
});
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
  const form = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema, { error: validationMessage }),
    defaultValues: {
      status: value.status === "UNREAD" ? "READ" : value.status,
      resolutionNote: value.resolutionNote ?? "",
    },
  });
  const { errors } = form.formState;
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ cập nhật cảnh báo chưa lưu?"))) return;
    setOpen(false);
  };
  return (
    <Panel title="Cập nhật tình trạng xử lý">
      {open ? (
        <Form
          compact
          form={form}
          cancel={
            <button type="button" onClick={cancel}>
              Hủy
            </button>
          }
          compareFields={[
            {
              name: "status",
              label: "Trạng thái xử lý",
              options: options([
                "READ",
                "IN_PROGRESS",
                "RESOLVED",
                "DISMISSED",
              ]),
            },
            { name: "resolutionNote", label: "Hướng xử lý hoặc lý do" },
          ]}
          onConflictReload={() => snapshot.load(reload)}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            await mutation.mutateAsync({
              alertId: value.id,
              payload: values,
              version: snapshot.base.version,
            });
            toast.success("Đã ghi nhận xử lý cảnh báo.");
            router.push("/alerts");
          }}
        >
          <FormSelect
            label="Trạng thái xử lý"
            required
            options={options(["READ", "IN_PROGRESS", "RESOLVED", "DISMISSED"])}
            {...form.register("status")}
            error={errors.status}
          />
          <FormTextarea
            label="Hướng xử lý hoặc lý do"
            hint="Bắt buộc trừ khi chỉ đánh dấu đã đọc."
            {...form.register("resolutionNote", {
              setValueAs: (value: string) => value || undefined,
            })}
            error={errors.resolutionNote}
          />
        </Form>
      ) : (
        <button
          type="button"
          onClick={() => {
            snapshot.saved(value);
            form.reset({
              status: value.status === "UNREAD" ? "READ" : value.status,
              resolutionNote: value.resolutionNote ?? "",
            });
            setOpen(true);
          }}
        >
          Cập nhật xử lý
        </button>
      )}
      <p className="small muted">
        Lưu xử lý cảnh báo không tự đổi trạng thái hoặc kế hoạch công việc.
      </p>
    </Panel>
  );
}
