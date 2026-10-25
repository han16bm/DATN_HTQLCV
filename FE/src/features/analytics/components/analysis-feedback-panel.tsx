"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { Badge, Panel } from "@/components/ui/page";
import { feedbackInputSchema } from "@/features/analytics/schemas/analysis-feedback.schema";
import { type AnalysisDto } from "@/features/analytics/types/analytics.types";
import { dateTime } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateAnalysisFeedbackMutation } from "../hooks/use-analytics-mutations";
export function FeedbackPanel({ value }: { value: AnalysisDto }) {
  const mutation = useCreateAnalysisFeedbackMutation();
  const [open, setOpen] = useState(false);
  const f = value.feedback.latest;
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
            <button onClick={() => setOpen(true)}>
              {f ? "Bổ sung phản hồi" : "Xác nhận hoặc bác bỏ nhận định"}
            </button>
          ) : (
            <SchemaForm
              schema={feedbackInputSchema}
              fields={[
                {
                  name: "verdict",
                  label: "Ý kiến",
                  type: "select",
                  required: true,
                  options: [
                    { value: "CONFIRMED", label: "Xác nhận nhận định" },
                    { value: "REJECTED", label: "Bác bỏ nhận định" },
                  ],
                },
                {
                  name: "comment",
                  label: "Căn cứ phản hồi",
                  type: "textarea",
                  required: true,
                },
              ]}
              onSubmit={async (values) => {
                await mutation.mutateAsync({
                  analysisId: value.snapshot.analysisId,
                  payload: values,
                });
                setOpen(false);
                toast.success("Đã ghi nhận phản hồi.");
              }}
            />
          )}
        </>
      )}
    </Panel>
  );
}
