"use client";

import { Form } from "@/components/forms/form";
import { FormInput, FormSelect } from "@/components/forms/form-field";
import { PageSkeleton } from "@/components/ui/loading";
import { PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import { options } from "@/lib/format";
import { validationMessage } from "@/lib/forms/validation-message";
import { ApiError } from "@/types/api/error";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateReportDraftMutation } from "../hooks/use-reports-mutations";
import {
  createReportSchema,
  periodTypeSchema,
} from "../schemas/reports.schema";
export function NewReportPage() {
  const projects = useListProjectsQuery({ pageSize: 100 });
  const create = useCreateReportDraftMutation();
  const router = useRouter();
  const [existing, setExisting] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(
      createReportSchema.pick({
        projectId: true,
        periodType: true,
        periodStart: true,
      }),
      { error: validationMessage },
    ),
    defaultValues: { periodType: "DAILY" },
  });
  const { errors } = form.formState;
  return (
    <>
      <PageHeader
        title="Chọn kỳ báo cáo"
        description="Tuần bắt đầu thứ Hai theo giờ Việt Nam; không tạo kỳ tương lai."
      />
      <Panel>
        {projects.isError ? (
          <QueryErrorState error={projects.error} />
        ) : !projects.data ? (
          <PageSkeleton variant="form" />
        ) : (
          <Form
            compact
            form={form}
            submitLabel="Lấy dữ liệu và mở bản nháp"
            onSubmit={async (values) => {
              setExisting(null);
              try {
                const r = await create.mutateAsync(values);
                router.push(`/reports/${r.id}/edit`);
              } catch (cause) {
                if (cause instanceof ApiError) {
                  const info = z
                    .object({ existingReportId: z.string() })
                    .safeParse(cause.details);
                  if (info.success) {
                    setExisting(info.data.existingReportId);
                    router.push(`/reports/${info.data.existingReportId}`);
                    return;
                  }
                }
                throw cause;
              }
            }}
          >
            <FormSelect
              label="Dự án"
              required
              options={projects.data.items
                .filter((p) => p.status === "ACTIVE")
                .map((p) => ({ value: p.id, label: p.name }))}
              {...form.register("projectId")}
              error={errors.projectId}
            />
            <FormSelect
              label="Loại báo cáo"
              required
              options={options(periodTypeSchema.options)}
              {...form.register("periodType")}
              error={errors.periodType}
            />
            <FormInput
              label="Ngày bắt đầu kỳ"
              required
              type="date"
              {...form.register("periodStart")}
              error={errors.periodStart}
            />
          </Form>
        )}
        {existing && (
          <p className="notice">
            <Link className="text-link" href={`/reports/${existing}`}>
              Mở báo cáo đã có cho kỳ này
            </Link>
          </p>
        )}
      </Panel>
    </>
  );
}
