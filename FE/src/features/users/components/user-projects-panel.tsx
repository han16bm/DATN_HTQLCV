"use client";
import { DataTable } from "@/components/patterns/data-table";
import { Lozenge, StatusLozenge } from "@/components/ui/lozenge";
import { linkClass } from "@/components/ui/page";
import { dateTime, label } from "@/lib/format";
import Link from "next/link";
import { useListUserProjectsQuery } from "../hooks/use-users-queries";

export function UserProjectsPanel({ userId }: { userId: string }) {
  const query = useListUserProjectsQuery(userId);
  const rows = query.data ?? [];
  const managing = rows.filter(
    (row) => !row.endedAt && row.projectRole !== "MEMBER",
  ).length;
  return (
    <DataTable
      title="Dự án tham gia"
      description={
        <p>
          Đang tham gia {rows.filter((row) => !row.endedAt).length} dự án, quản
          lý {managing} dự án. Vai trò Phụ trách/Quản lý chỉ có hiệu lực khi tài
          khoản có quyền Leader/PM (PROJECT_CREATE).
        </p>
      }
      loading={query.isPending}
      error={query.error}
      onRetry={query.refetch}
      widths={[30, 16, 16, 38]}
      headers={["Dự án", "Vai trò", "Trạng thái dự án", "Quyền trong dự án"]}
      rows={rows.map((row) => [
        <span key="project" className="grid gap-0.5">
          <Link
            className={linkClass}
            href={`/projects/${encodeURIComponent(row.project.id)}`}
          >
            {row.project.name}
          </Link>
          <span className="text-xs text-fg-subtle">
            {row.endedAt
              ? `Đã kết thúc ${dateTime(row.endedAt)}`
              : `Từ ${dateTime(row.startedAt)}`}
          </span>
        </span>,
        <Lozenge key="role" tone={row.endedAt ? "neutral" : "info"}>
          {label(row.projectRole)}
        </Lozenge>,
        <StatusLozenge key="status" value={row.projectStatus} />,
        row.permissions.length ? (
          <span key="perms" className="text-xs text-fg-subtle">
            {row.permissions.map(label).join(", ")}
          </span>
        ) : (
          <span key="perms" className="text-xs text-fg-subtle">
            {row.endedAt ? "Không còn quyền" : "Làm việc được giao"}
          </span>
        ),
      ])}
    />
  );
}
