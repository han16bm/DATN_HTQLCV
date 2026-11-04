"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { RowDialogLinks } from "@/components/ui/entity-dialog";
import { Badge, ButtonLink, DataTable, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListUnitsQuery } from "../hooks/use-organization-queries";
import { UnitDialog } from "./unit-dialog";

export function OrganizationPage() {
  const filters = useUrlFilters();
  const query = useListUnitsQuery({ page: filters.page });
  const dialog = useEntityDialog();
  return (
    <>
      <PageHeader
        title="Cơ cấu đơn vị"
        actions={
          <>
            <ButtonLink href="/admin/teams">Quản lý nhóm</ButtonLink>
            <ButtonLink href={dialog.href("create")} primary>
              Thêm đơn vị
            </ButtonLink>
          </>
        }
      />
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          title="Danh sách đơn vị"
          actions
          widths={[58, 24, 18]}
          headers={["Đơn vị", "Trạng thái", "Hành động"]}
          rows={query.data.items.map((unit) => [
            unit.name,
            <Badge key="status" value={unit.status} />,
            <RowDialogLinks
              key="detail"
              name={`đơn vị ${unit.name}`}
              view={dialog.href("view", unit.id)}
              edit={
                unit.status === "ACTIVE"
                  ? dialog.href("edit", unit.id)
                  : undefined
              }
            />,
          ])}
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filters.set("page", String(p)),
          }}
        />
      )}
      <UnitDialog />
    </>
  );
}
