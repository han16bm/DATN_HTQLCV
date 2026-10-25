"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { PageHeader, Panel } from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListProjectsQuery } from "@/features/projects/hooks/use-projects-queries";
import {
  createReportSchema,
  periodTypeSchema,
} from "@/features/reports/schemas/reports.schema";
import { options } from "@/lib/format";
import { ApiError } from "@/types/api/error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useCreateReportDraftMutation } from "../hooks/use-reports-mutations";
export function NewReportPage() {
  const projects = useListProjectsQuery({ pageSize: 100 });
  const create = useCreateReportDraftMutation();
  const router = useRouter();
  const [existing, setExisting] = useState<string | null>(null);
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
          <SchemaForm
            schema={createReportSchema.pick({
              projectId: true,
              periodType: true,
              periodStart: true,
            })}
            fields={[
              {
                name: "projectId",
                label: "Dự án",
                type: "select",
                required: true,
                options: projects.data.items
                  .filter((p) => p.status === "ACTIVE")
                  .map((p) => ({ value: p.id, label: p.name })),
              },
              {
                name: "periodType",
                label: "Loại báo cáo",
                type: "select",
                required: true,
                options: options(periodTypeSchema.options),
              },
              {
                name: "periodStart",
                label: "Ngày bắt đầu kỳ",
                type: "date",
                required: true,
              },
            ]}
            defaults={{ periodType: "DAILY" }}
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
          />
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
