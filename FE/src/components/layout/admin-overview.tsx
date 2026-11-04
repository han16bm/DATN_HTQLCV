"use client";
import { Skeleton } from "@/components/ui/loading";
import { DataTable, PageHeader, Panel } from "@/components/ui/page";
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
      <section className="overview-stats" aria-label="Chỉ số quản trị">
        {can("USERS_MANAGE") && (
          <>
            <UserCount status="ACTIVE" title="Tài khoản hoạt động" />
            <UserCount status="LOCKED" title="Tài khoản bị khóa" />
          </>
        )}
        {can("PERMISSIONS_MANAGE") && <GroupCount />}
        {can("SETTINGS_MANAGE") && <WhitelistStat />}
      </section>
      <div className="admin-overview-grid">
        {can("JOBS_MANAGE") && <JobsCard />}
        {can("AUDIT_VIEW") && <RecentAudits />}
        <Panel title="Lối tắt">
          <ul className="admin-shortcuts">
            {shortcuts.map((item) => (
              <li key={item.href}>
                <Link className="text-link" href={item.href}>
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
    <Link className="overview-stat" href={href} aria-busy={pending}>
      <span>{title}</span>
      <strong>
        {pending ? <Skeleton className="skeleton-count" /> : children}
      </strong>
      <span className={`small ${error ? "field-error" : "muted"}`}>
        {error ? "Không tải được số liệu" : "Xem chi tiết"}
      </span>
    </Link>
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

const jobStatus: Record<string, string> = {
  SUCCEEDED: "Thành công",
  FAILED: "Lỗi",
  RUNNING: "Đang chạy",
};
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
          className="text-link"
          href={`/admin/jobs?dialog=view&id=${encodeURIComponent(job.code)}`}
        >
          {job.name}
        </Link>,
        dateTime(job.lastRunAt),
        job.lastStatus ? (
          <span
            key="status"
            className={`badge ${job.lastStatus.toLowerCase()}`}
          >
            {jobStatus[job.lastStatus]}
          </span>
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
        <Link className="text-link" href="/admin/audit-logs">
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
