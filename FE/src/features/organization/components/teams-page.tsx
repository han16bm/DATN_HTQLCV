"use client";
import { DataTable } from "@/components/patterns/data-table";
import { StatusLozenge } from "@/components/ui/lozenge";

import { PageSkeleton } from "@/components/ui/loading";
import { RowDialogLinks } from "@/components/ui/entity-dialog";
import { ButtonLink, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListTeamsQuery } from "../hooks/use-organization-queries";
import { TeamDialog } from "./team-dialog";

export function TeamsPage() {
  const filters = useUrlFilters();
  const query = useListTeamsQuery({ page: filters.page });
  const dialog = useEntityDialog();
  return (
    <>
      <PageHeader
        title="Nhóm nhân sự"
        actions={
          <>
            <ButtonLink href="/admin/organization">Cơ cấu đơn vị</ButtonLink>
            <ButtonLink href={dialog.href("create")} primary>
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
            <StatusLozenge key="status" value={team.status} />,
            <RowDialogLinks
              key="detail"
              name={`nhóm ${team.name}`}
              view={dialog.href("view", team.id)}
              edit={
                team.status === "ACTIVE"
                  ? dialog.href("edit", team.id)
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
      <TeamDialog />
    </>
  );
}
