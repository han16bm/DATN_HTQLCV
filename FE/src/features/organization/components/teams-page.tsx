"use client";
import { PermissionGate } from "@/components/layout/permission-gate";
import {
  Badge,
  ButtonLink,
  DataTable,
  DetailLink,
  PageHeader,
} from "@/components/ui/page";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListTeamsQuery } from "../hooks/use-organization-queries";

export function TeamsPage() {
  return (
    <PermissionGate permission="ORGANIZATION_MANAGE">
      <TeamsList />
    </PermissionGate>
  );
}
function TeamsList() {
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
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          title="Danh sách nhóm"
          actions
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
