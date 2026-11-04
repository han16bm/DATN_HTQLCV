"use client";
import { FilterBar, FilterField } from "@/components/patterns/filter-bar";
import { DataTable } from "@/components/patterns/data-table";
import { StatusLozenge } from "@/components/ui/lozenge";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/input";

import { PageSkeleton } from "@/components/ui/loading";
import { RowDialogLinks } from "@/components/ui/entity-dialog";
import { ButtonLink, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { label } from "@/lib/format";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useListPermissionGroupsQuery } from "../hooks/use-permissions-queries";
import { groupStatusSchema } from "../schemas/permission-group.schema";
import { PermissionGroupDialog } from "./permission-group-dialog";

export function PermissionGroupsPage() {
  const filter = useUrlFilters();
  const dialog = useEntityDialog();
  const status = groupStatusSchema.safeParse(filter.get("status"));
  const query = useListPermissionGroupsQuery({
    page: filter.page,
    q: filter.get("q") || undefined,
    status: status.success ? status.data : undefined,
  });
  return (
    <>
      <PageHeader
        title="Nhóm quyền"
        actions={
          <ButtonLink href={dialog.href("create")} primary>
            Tạo nhóm quyền
          </ButtonLink>
        }
      />
      <FilterBar label="Bộ lọc nhóm quyền">
        <FilterField label="Tìm kiếm" search>
          <SearchInput
            placeholder="Mã hoặc tên nhóm"
            value={filter.get("q")}
            onChange={(e) => filter.set("q", e.target.value)}
          />
        </FilterField>
        <FilterField label="Trạng thái">
          <Select
            fit
            value={filter.get("status")}
            onChange={(e) => filter.set("status", e.target.value)}
          >
            <option value="">Tất cả</option>
            {groupStatusSchema.options.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterBar>
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          actions
          widths={[20, 28, 12, 10, 12, 8, 10]}
          headers={[
            "Mã",
            "Tên nhóm",
            "Thành viên",
            "Số quyền",
            "Trạng thái",
            "Hệ thống",
            "Hành động",
          ]}
          rows={query.data.items.map((group) => [
            group.code,
            group.name,
            String(group.memberIds.length),
            String(group.features.length),
            <StatusLozenge key="status" value={group.status} />,
            group.isSystem ? "Có" : "—",
            <RowDialogLinks
              key="detail"
              name={`nhóm quyền ${group.name}`}
              view={dialog.href("view", group.id)}
              edit={dialog.href("edit", group.id)}
            />,
          ])}
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filter.set("page", String(p)),
          }}
        />
      )}
      <PermissionGroupDialog />
    </>
  );
}
