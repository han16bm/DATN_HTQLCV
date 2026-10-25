"use client";
import { PermissionGate } from "@/components/layout/permission-gate";
import { ButtonLink, PageHeader } from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { useRouter } from "next/navigation";
import {
  useGetUnitQuery,
  useListUnitsQuery,
} from "../hooks/use-organization-queries";
import { UnitForm } from "./unit-form";
export function UnitEditorPage({ unitId }: { unitId?: string }) {
  return (
    <PermissionGate permission="ORGANIZATION_MANAGE">
      <UnitEditor unitId={unitId} />
    </PermissionGate>
  );
}
function UnitEditor({ unitId }: { unitId?: string }) {
  const router = useRouter();
  const query = useGetUnitQuery(unitId ?? "");
  const units = useListUnitsQuery({ pageSize: 100 });
  const users = useListUsersQuery({ pageSize: 100, status: "ACTIVE" });
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (units.isError)
    return (
      <QueryErrorState error={units.error} retry={() => void units.refetch()} />
    );
  if (users.isError)
    return (
      <QueryErrorState error={users.error} retry={() => void users.refetch()} />
    );
  if (!units.data || !users.data || (unitId && query.isPending))
    return <PageSkeleton variant="form" />;
  return (
    <>
      <PageHeader
        title={unitId ? "Chi tiết đơn vị" : "Thêm đơn vị"}
        actions={
          <ButtonLink href="/admin/organization">Danh sách đơn vị</ButtonLink>
        }
      />
      <UnitForm
        key={unitId ?? "new"}
        unit={query.data}
        reload={() => query.refetch()}
        units={units.data.items}
        users={users.data.items.map((user) => ({
          value: user.id,
          label: user.displayName,
        }))}
        onCreated={(id) =>
          router.push(`/admin/organization/${encodeURIComponent(id)}`)
        }
      />
    </>
  );
}
