"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { Badge, ButtonLink, DataTable, PageHeader } from "@/components/ui/page";
import { RowDialogLinks } from "@/components/ui/entity-dialog";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useListUnitsQuery } from "@/features/organization/hooks/use-organization-queries";
import { useListPermissionGroupsQuery } from "@/features/permissions/hooks/use-permissions-queries";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { label } from "@/lib/format";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListUsersQuery } from "../hooks/use-users-queries";
import { UserDialog } from "./user-dialog";
import { userStatusSchema } from "../schemas/user.schema";

export function UsersPage() {
  const filter = useUrlFilters();
  const status = userStatusSchema.safeParse(filter.get("status"));
  const dialog = useEntityDialog();
  const query = useListUsersQuery({
    page: filter.page,
    q: filter.get("q") || undefined,
    status: status.success ? status.data : undefined,
    groupId: filter.get("groupId") || undefined,
    unitId: filter.get("unitId") || undefined,
  });
  const units = useListUnitsQuery({ pageSize: 100 });
  // GET /permission-groups mở cho USERS_MANAGE để lọc theo nhóm (ADMIN_MODULES 7.1).
  const groups = useListPermissionGroupsQuery({ pageSize: 100 });
  return (
    <>
      <PageHeader
        title="Tài khoản người dùng"
        actions={
          <ButtonLink href={dialog.href("create")} primary>
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
        {groups.data && (
          <label>
            Nhóm quyền
            <select
              value={filter.get("groupId")}
              onChange={(e) => filter.set("groupId", e.target.value)}
            >
              <option value="">Tất cả nhóm</option>
              {groups.data.items.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>
      {units.isError && (
        <QueryErrorState error={units.error} retry={units.refetch} />
      )}
      {query.isPending && <PageSkeleton variant="table" />}
      {query.isError && (
        <QueryErrorState error={query.error} retry={query.refetch} />
      )}{" "}
      {query.data && (
        <DataTable
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filter.set("page", String(p)),
          }}
          actions
          widths={[32, 24, 19, 15, 10]}
          headers={[
            "Người dùng",
            "Nhóm quyền",
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
            <span key="groups" className="tag-list">
              {u.isSysAdmin && <span className="badge active">Sysadmin</span>}
              {u.groups.slice(0, 2).map((g) => (
                <span key={g.id} className="badge">
                  {g.label}
                </span>
              ))}
              {u.groups.length > 2 && (
                <span
                  className="small muted"
                  title={u.groups.map((g) => g.label).join(", ")}
                >
                  +{u.groups.length - 2}
                </span>
              )}
              {!u.isSysAdmin && !u.groups.length && "—"}
            </span>,
            u.unit.name,
            <Badge key="status" value={u.status} />,
            <RowDialogLinks
              key="detail"
              name={`hồ sơ ${u.displayName}`}
              view={dialog.href("view", u.id)}
              edit={dialog.href("edit", u.id)}
            />,
          ])}
        />
      )}
      <UserDialog />
    </>
  );
}
