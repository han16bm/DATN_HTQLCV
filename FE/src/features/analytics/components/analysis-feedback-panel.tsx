"use client";

import { Form } from "@/components/forms/form";
import { FormSelect, FormTextarea } from "@/components/forms/form-field";
import { Badge, Panel } from "@/components/ui/page";
import { dateTime } from "@/lib/format";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateAnalysisFeedbackMutation } from "../hooks/use-analytics-mutations";
import { feedbackInputSchema } from "../schemas/analysis-feedback.schema";
import { type AnalysisDto } from "../types/analytics.types";
export function FeedbackPanel({ value }: { value: AnalysisDto }) {
  const mutation = useCreateAnalysisFeedbackMutation();
  const [open, setOpen] = useState(false);
  const f = value.feedback.latest;
  const form = useForm({
    resolver: zodResolver(feedbackInputSchema, { error: validationMessage }),
    defaultValues: {},
  });
  const { errors } = form.formState;
  return (
    <Panel title="Phản hồi nhận định điểm nghẽn">
      {f && (
        <>
          <Badge value={f.verdict} />
          <p className="preserve-lines">{f.comment}</p>
          <p className="small muted">
            {f.actor.displayName} · {dateTime(f.createdAt)}
          </p>
        </>
      )}
      {value.feedback.canSubmit && (
        <>
          {!open ? (
            <button
              onClick={() => {
                form.reset();
                setOpen(true);
              }}
            >
              {f ? "Bổ sung phản hồi" : "Xác nhận hoặc bác bỏ nhận định"}
            </button>
          ) : (
            <Form
              compact
              form={form}
              onSubmit={async (values) => {
                await mutation.mutateAsync({
                  analysisId: value.snapshot.analysisId,
                  payload: values,
                });
                setOpen(false);
                toast.success("Đã ghi nhận phản hồi.");
              }}
            >
              <FormSelect
                label="Ý kiến"
                required
                options={[
                  { value: "CONFIRMED", label: "Xác nhận nhận định" },
                  { value: "REJECTED", label: "Bác bỏ nhận định" },
                ]}
                {...form.register("verdict")}
                error={errors.verdict}
              />
              <FormTextarea
                label="Căn cứ phản hồi"
                required
                {...form.register("comment")}
                error={errors.comment}
              />
            </Form>
          )}
        </>
      )}
    </Panel>
  );
}
