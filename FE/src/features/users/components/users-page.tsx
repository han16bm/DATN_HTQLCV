"use client";
import { PermissionGate } from "@/components/layout/permission-gate";
import {
  Badge,
  ButtonLink,
  DataTable,
  Loading,
  PageHeader,
  Pagination,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUnitsQuery } from "@/features/organization/hooks/use-organization-queries";
import {
  systemRoleSchema,
  userStatusSchema,
} from "@/features/users/schemas/user.schema";
import { label } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import Link from "next/link";
import { useListUsersQuery } from "../hooks/use-users-queries";

export function UsersPage() {
  return (
    <PermissionGate permission="USERS_MANAGE">
      <UsersList />
    </PermissionGate>
  );
}
function UsersList() {
  const filter = useUrlFilters();
  const status = userStatusSchema.safeParse(filter.get("status"));
  const role = systemRoleSchema.safeParse(filter.get("systemRole"));
  const query = useListUsersQuery({
    page: filter.page,
    q: filter.get("q") || undefined,
    status: status.success ? status.data : undefined,
    systemRole: role.success ? role.data : undefined,
    unitId: filter.get("unitId") || undefined,
  });
  const units = useListUnitsQuery({ pageSize: 100 });
  return (
    <>
      <PageHeader
        title="Tài khoản người dùng"
        description="Quản lý tài khoản nội bộ và phạm vi truy cập."
        actions={
          <ButtonLink href="/admin/users/new" primary>
            Cấp tài khoản
          </ButtonLink>
        }
      />
      <section className="panel filters">
        <label>
          Tìm kiếm
          <input
            type="search"
            placeholder="Tên, email hoặc tên đăng nhập"
            value={filter.get("q")}
            onChange={(e) => filter.set("q", e.target.value)}
          />
        </label>
        <label>
          Trạng thái
          <select
            value={filter.get("status")}
            onChange={(e) => filter.set("status", e.target.value)}
          >
            <option value="">Tất cả</option>
            {userStatusSchema.options.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Đơn vị
          <select
            value={filter.get("unitId")}
            onChange={(e) => filter.set("unitId", e.target.value)}
          >
            <option value="">Tất cả đơn vị</option>
            {units.data?.items.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vai trò
          <select
            value={filter.get("systemRole")}
            onChange={(e) => filter.set("systemRole", e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            {systemRoleSchema.options.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </select>
        </label>
      </section>
      {query.isPending && <Loading />}
      {query.isError && (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      )}{" "}
      {query.data && (
        <section className="panel">
          <DataTable
            headers={[
              "Người dùng",
              "Vai trò hệ thống",
              "Đơn vị",
              "Trạng thái",
              "",
            ]}
            rows={query.data.items.map((u) => [
              <div key="name">
                <Link className="text-link" href={`/admin/users/${u.id}`}>
                  {u.displayName}
                </Link>
                <div className="small muted">
                  {u.email} · {u.username}
                </div>
              </div>,
              label(u.systemRole),
              u.unit.name,
              <Badge key="status" value={u.status} />,
              <Link
                key="detail"
                className="text-link"
                href={`/admin/users/${u.id}`}
              >
                Chi tiết
              </Link>,
            ])}
          />
          <Pagination
            {...query.data.pagination}
            onPage={(p) => filter.set("page", String(p))}
          />
        </section>
      )}
    </>
  );
}
