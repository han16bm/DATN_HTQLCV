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
          <>
            <ButtonLink href="/admin/teams">Quản lý nhóm</ButtonLink>
            <ButtonLink href="/admin/organization/new" primary>
              Thêm đơn vị
            </ButtonLink>
          </>
        }
      />
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
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
