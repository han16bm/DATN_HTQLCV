"use client";
import { UnitForm } from "./unit-form";

import { PermissionGate } from "@/components/layout/permission-gate";
import {
  Badge,
  ButtonLink,
  Empty,
  Loading,
  PageHeader,
  Pagination,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useUI } from "@/stores/ui-store";
import {
  useGetUnitQuery,
  useListUnitsQuery,
} from "../hooks/use-organization-queries";

export function OrganizationPage() {
  return (
    <PermissionGate permission="ORGANIZATION_MANAGE">
      <UnitsWorkspace />
    </PermissionGate>
  );
}
function UnitsWorkspace() {
  const filters = useUrlFilters();
  const units = useListUnitsQuery({ page: filters.page, pageSize: 100 });
  const users = useListUsersQuery({ pageSize: 100, status: "ACTIVE" });
  const selectedId = filters.get("unit") || units.data?.items[0]?.id || "";
  const detail = useGetUnitQuery(selectedId, {
    enabled: selectedId !== "new",
  });
  if (units.isError)
    return (
      <QueryErrorState error={units.error} retry={() => void units.refetch()} />
    );
  return (
    <>
      <PageHeader
        title="Cơ cấu đơn vị"
        description="Sắp xếp đơn vị, người phụ trách và thành viên."
        actions={
          <>
            <ButtonLink href="/admin/teams">Quản lý nhóm</ButtonLink>
            <button
              className="primary"
              onClick={() => {
                if (confirmDiscard()) filters.set("unit", "new");
              }}
            >
              Thêm đơn vị
            </button>
          </>
        }
      />
      {!units.data ? (
        <Loading />
      ) : (
        <div className="organization-layout">
          <Panel title="Danh sách đơn vị">
            <div className="entity-list">
              {units.data.items.map((u) => (
                <button
                  key={u.id}
                  className={u.id === selectedId ? "selected" : ""}
                  onClick={() => {
                    if (!confirmDiscard()) return;
                    filters.set("unit", u.id);
                  }}
                >
                  <span>{u.name}</span>
                  <Badge value={u.status} />
                </button>
              ))}
              {!units.data.items.length && <Empty />}
            </div>
            <Pagination
              {...units.data.pagination}
              onPage={(p) => filters.set("page", String(p))}
            />
          </Panel>
          <div>
            {selectedId === "new" ? (
              <UnitForm
                key="new"
                onCreated={(id) => filters.set("unit", id)}
                units={units.data.items}
                users={
                  users.data?.items.map((u) => ({
                    value: u.id,
                    label: u.displayName,
                  })) ?? []
                }
              />
            ) : detail.isError ? (
              <QueryErrorState
                error={detail.error}
                retry={() => void detail.refetch()}
              />
            ) : detail.data ? (
              <UnitForm
                key={detail.data.id}
                unit={detail.data}
                units={units.data.items}
                users={
                  users.data?.items.map((u) => ({
                    value: u.id,
                    label: u.displayName,
                  })) ?? []
                }
                reload={() => detail.refetch()}
              />
            ) : selectedId ? (
              <Loading />
            ) : (
              <Empty />
            )}
            {users.isError && (
              <QueryErrorState
                error={users.error}
                retry={() => void users.refetch()}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
function confirmDiscard() {
  if (
    useUI.getState().dirtyForms.length &&
    !window.confirm("Bỏ các thay đổi chưa lưu để chuyển đơn vị?")
  )
    return false;
  useUI.getState().reset();
  return true;
}
