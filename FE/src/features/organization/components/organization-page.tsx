"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { ButtonLink, DetailLink, PageHeader } from "@/components/ui/page";
import { StatusLozenge } from "@/components/ui/lozenge";
import { DataTable } from "@/components/patterns/data-table";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListUnitsQuery } from "../hooks/use-organization-queries";

export function OrganizationPage() {
  const filters = useUrlFilters();
  const query = useListUnitsQuery({ page: filters.page });
  return (
    <>
      <PageHeader
        title="Cơ cấu đơn vị"
        actions={
          <ButtonLink href="/admin/organization/new" primary>
            Thêm đơn vị
          </ButtonLink>
        }
      />
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          loading={query.isFetching}
          title="Danh sách đơn vị"
          actions
          widths={[58, 24, 18]}
          headers={["Đơn vị", "Trạng thái", "Hành động"]}
          rows={query.data.items.map((unit) => [
            unit.name,
            <StatusLozenge key="status" value={unit.status} />,
            <DetailLink
              key="detail"
              href={`/admin/organization/${encodeURIComponent(unit.id)}`}
              label={`Xem đơn vị ${unit.name}`}
            />,
          ])}
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filters.set("page", String(p)),
          }}
        />
      )}
    </>
  );
}
