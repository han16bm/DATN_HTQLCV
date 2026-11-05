"use client";
import { DataTable } from "@/components/patterns/data-table";
import { Metric, MetricStrip } from "@/components/patterns/metric";
import { StatusLozenge } from "@/components/ui/lozenge";
import { Skeleton } from "@/components/ui/loading";
import { PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useListAuditLogsQuery } from "@/features/audit-logs/hooks/use-audit-logs-queries";
import { useGetIpWhitelistQuery } from "@/features/ip-whitelist/hooks/use-ip-whitelist-queries";
import { useListJobsQuery } from "@/features/jobs/hooks/use-jobs-queries";
import { useListPermissionGroupsQuery } from "@/features/permissions/hooks/use-permissions-queries";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { canVisit, hasPermission } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, entityTypeLabel } from "@/lib/format";
import { navigation } from "@/lib/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

// Tổng quan khu quản trị ghép từ các API sẵn có; mỗi khối chỉ mount khi có quyền
// tương ứng nên không gửi request bị từ chối.
export function AdminOverview() {
  const { session } = useSession();
  const can = (permission: Parameters<typeof hasPermission>[1]) =>
    hasPermission(session, permission);
  const shortcuts = navigation.admin.filter(
    (item) => item.href !== "/admin" && canVisit(session, item.href),
  );
  return (
    <>
      <PageHeader title="Tổng quan quản trị" />
      <MetricStrip aria-label="Chỉ số quản trị">
        {can("USERS_MANAGE") && (
          <>
            <UserCount status="ACTIVE" title="Tài khoản hoạt động" />
            <UserCount status="LOCKED" title="Tài khoản bị khóa" />
          </>
        )}
        {can("PERMISSIONS_MANAGE") && <GroupCount />}
        {can("SETTINGS_MANAGE") && <WhitelistStat />}
      </MetricStrip>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        {can("JOBS_MANAGE") && <JobsCard />}
        {can("AUDIT_VIEW") && <RecentAudits />}
        <Panel title="Lối tắt">
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {shortcuts.map((item) => (
              <li key={item.href}>
                <Link
                  className="font-medium text-selected-fg underline-offset-2 hover:underline"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Stat({
  title,
  href,
  pending,
  error,
  children,
}: {
  title: string;
  href: string;
  pending: boolean;
  error: boolean;
  children: ReactNode;
}) {
  return (
    <Metric
      label={title}
      href={href}
      tone={error ? "danger" : undefined}
      value={pending ? <Skeleton className="my-2 h-5 w-12" /> : children}
      hint={error ? "Không tải được số liệu" : "Xem chi tiết"}
    />
  );
}

function UserCount({
  status,
  title,
}: {
  status: "ACTIVE" | "LOCKED";
  title: string;
}) {
  const query = useListUsersQuery({ status, pageSize: 1 });
  return (
    <Stat
      title={title}
      href={`/admin/users?status=${status}`}
      pending={query.isPending}
      error={query.isError}
    >
      {query.data?.pagination.total ?? "—"}
    </Stat>
  );
}

function GroupCount() {
  const query = useListPermissionGroupsQuery({ pageSize: 1 });
  return (
    <Stat
      title="Nhóm quyền"
      href="/admin/permission-groups"
      pending={query.isPending}
      error={query.isError}
    >
      {query.data?.pagination.total ?? "—"}
    </Stat>
  );
}

function WhitelistStat() {
  const query = useGetIpWhitelistQuery();
  return (
    <Stat
      title="IP whitelist"
      href="/admin/ip-whitelist"
      pending={query.isPending}
      error={query.isError}
    >
      {query.data ? (query.data.enabled ? "Bật" : "Tắt") : "—"}
    </Stat>
  );
}

function JobsCard() {
  const query = useListJobsQuery();
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  return (
    <DataTable
      title="Job nền"
      widths={[46, 30, 24]}
      headers={["Job", "Lần chạy cuối", "Kết quả"]}
      rows={(query.data ?? []).map((job) => [
        <Link
          key="job"
          className="font-medium text-selected-fg underline-offset-2 hover:underline"
          href={`/admin/jobs?dialog=view&id=${encodeURIComponent(job.code)}`}
        >
          {job.name}
        </Link>,
        dateTime(job.lastRunAt),
        job.lastStatus ? (
          <StatusLozenge key="status" value={job.lastStatus} />
        ) : (
          "Chưa chạy"
        ),
      ])}
    />
  );
}

function RecentAudits() {
  const query = useListAuditLogsQuery({ pageSize: 10 });
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  return (
    <DataTable
      title="Thao tác gần đây"
      headerActions={
        <Link
          className="font-medium text-selected-fg underline-offset-2 hover:underline"
          href="/admin/audit-logs"
        >
          Xem nhật ký
        </Link>
      }
      widths={[24, 30, 46]}
      headers={["Thời điểm", "Người thao tác", "Hành động"]}
      rows={(query.data?.items ?? []).map((item) => [
        dateTime(item.at),
        <UserBadge key="actor" name={item.actor.label} />,
        `${item.action} · ${entityTypeLabel(item.entityType)}`,
      ])}
    />
  );
}
