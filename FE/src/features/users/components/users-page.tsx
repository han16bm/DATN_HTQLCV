"use client";

import { PageSkeleton } from "@/components/ui/loading";
import {
  Badge,
  ButtonLink,
  DataTable,
  DetailLink,
  PageHeader,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useListUnitsQuery } from "@/features/organization/hooks/use-organization-queries";
import { label } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListUsersQuery } from "../hooks/use-users-queries";
import { systemRoleSchema, userStatusSchema } from "../schemas/user.schema";

export function UsersPage() {
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
      {units.isError && (
        <QueryErrorState
          error={units.error}
          retry={() => void units.refetch()}
        />
      )}
      {query.isPending && <PageSkeleton variant="table" />}
      {query.isError && (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      )}{" "}
      {query.data && (
        <DataTable
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filter.set("page", String(p)),
          }}
          actions
          widths={[36, 17, 22, 15, 10]}
          headers={[
            "Người dùng",
            "Vai trò hệ thống",
            "Đơn vị",
            "Trạng thái",
            "Hành động",
          ]}
          rows={query.data.items.map((u) => [
            <UserBadge
              key="name"
              name={u.displayName}
              avatarUrl={u.avatarUrl}
              href={`/users/${encodeURIComponent(u.id)}`}
              detail={`${u.email} · ${u.username}`}
            />,
            label(u.systemRole),
            u.unit.name,
            <Badge key="status" value={u.status} />,
            <DetailLink
              key="detail"
              href={`/admin/users/${u.id}`}
              label={`Xem hồ sơ ${u.displayName}`}
            />,
          ])}
        />
      )}
    </>
  );
}
