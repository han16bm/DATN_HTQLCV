"use client";
import { UserCommands } from "./user-commands";
import { UserProfileForm } from "./user-profile-form";

import { PermissionGate } from "@/components/layout/permission-gate";
import { ButtonLink, Loading, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUnitsQuery } from "@/features/organization/hooks/use-organization-queries";
import { useGetUserQuery } from "../hooks/use-users-queries";
export function UserEditorPage({ userId }: { userId?: string }) {
  return (
    <PermissionGate permission="USERS_MANAGE">
      <UserEditorLoader userId={userId} />
    </PermissionGate>
  );
}
function UserEditorLoader({ userId }: { userId?: string }) {
  const query = useGetUserQuery(userId ?? "");
  const units = useListUnitsQuery({ pageSize: 100, status: "ACTIVE" });
  if (units.isError)
    return (
      <QueryErrorState error={units.error} retry={() => void units.refetch()} />
    );
  if (!units.data || (userId && query.isPending)) return <Loading />;
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  return (
    <>
      <PageHeader
        title={userId ? "Chi tiết tài khoản" : "Cấp tài khoản nội bộ"}
        description="Vai trò hệ thống và quyền trên dự án được quản lý riêng."
        actions={
          <ButtonLink href="/admin/users">Danh sách tài khoản</ButtonLink>
        }
      />
      <UserProfileForm
        key={userId ?? "new"}
        user={query.data}
        units={units.data.items.map((u) => ({ value: u.id, label: u.name }))}
        reload={() => query.refetch()}
      />
      {query.data && <UserCommands user={query.data} />}
    </>
  );
}
