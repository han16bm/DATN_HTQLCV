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
import { useListTeamsQuery } from "../hooks/use-organization-queries";

export function TeamsPage() {
  const filters = useUrlFilters();
  const query = useListTeamsQuery({ page: filters.page });
  return (
    <>
      <PageHeader
        title="Nhóm nhân sự"
        actions={
          <>
            <ButtonLink href="/admin/organization">Cơ cấu đơn vị</ButtonLink>
            <ButtonLink href="/admin/teams/new" primary>
              Tạo nhóm
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
          title="Danh sách nhóm"
          actions
          widths={[28, 28, 14, 18, 12]}
          headers={[
            "Nhóm",
            "Đơn vị",
            "Số thành viên",
            "Trạng thái",
            "Hành động",
          ]}
          rows={query.data.items.map((team) => [
            team.name,
            team.unit.name,
            String(team.memberCount),
            <Badge key="status" value={team.status} />,
            <DetailLink
              key="detail"
              href={`/admin/teams/${encodeURIComponent(team.id)}`}
              label={`Xem nhóm ${team.name}`}
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
