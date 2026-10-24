"use client";
import { TeamForm } from "./team-form";

import { PermissionGate } from "@/components/layout/permission-gate";
import {
  Badge,
  ButtonLink,
  Empty,
  Loading,
  PageHeader,
  Panel,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useUI } from "@/stores/ui-store";
import {
  useGetTeamQuery,
  useListTeamsQuery,
  useListUnitsQuery,
} from "../hooks/use-organization-queries";
export function TeamsPage() {
  return (
    <PermissionGate permission="ORGANIZATION_MANAGE">
      <TeamsWorkspace />
    </PermissionGate>
  );
}
function TeamsWorkspace() {
  const filters = useUrlFilters();
  const teams = useListTeamsQuery({ pageSize: 100 });
  const units = useListUnitsQuery({ pageSize: 100, status: "ACTIVE" });
  const users = useListUsersQuery({ pageSize: 100, status: "ACTIVE" });
  const id = filters.get("team") || teams.data?.items[0]?.id || "";
  const query = useGetTeamQuery(id, { enabled: id !== "new" });
  const select = (value: string) => {
    if (
      useUI.getState().dirtyForms.length &&
      !window.confirm("Bỏ các thay đổi chưa lưu để chuyển nhóm?")
    )
      return;
    useUI.getState().reset();
    filters.set("team", value);
  };
  if (teams.isError)
    return (
      <QueryErrorState error={teams.error} retry={() => void teams.refetch()} />
    );
  return (
    <>
      <PageHeader
        title="Nhóm nhân sự"
        description="Thành viên nhóm và thành viên dự án được quản lý riêng."
        actions={
          <>
            <ButtonLink href="/admin/organization">Cơ cấu đơn vị</ButtonLink>
            <button className="primary" onClick={() => select("new")}>
              Tạo nhóm
            </button>
          </>
        }
      />
      {!teams.data || !units.data || !users.data ? (
        <>
          {units.isError ? (
            <QueryErrorState error={units.error} />
          ) : users.isError ? (
            <QueryErrorState error={users.error} />
          ) : (
            <Loading />
          )}
        </>
      ) : (
        <div className="organization-layout">
          <Panel title="Các nhóm hiện có">
            <div className="entity-list">
              {teams.data.items.map((t) => (
                <button
                  key={t.id}
                  onClick={() => select(t.id)}
                  className={t.id === id ? "selected" : ""}
                >
                  <span>{t.name}</span>
                  <span className="muted small">
                    {units.data?.items.find((u) => u.id === t.unitId)?.name ??
                      "Đơn vị đã ngừng sử dụng"}{" "}
                    · {t.memberCount} thành viên
                  </span>
                  <Badge value={t.status} />
                </button>
              ))}
              {!teams.data.items.length && <Empty />}
            </div>
          </Panel>
          <div>
            {id === "new" ? (
              <TeamForm
                key="new"
                onCreated={(id) => filters.set("team", id)}
                units={units.data.items}
                people={users.data.items.map((u) => ({
                  value: u.id,
                  label: u.displayName,
                  parentValue: u.unitId,
                }))}
              />
            ) : query.isError ? (
              <QueryErrorState
                error={query.error}
                retry={() => void query.refetch()}
              />
            ) : query.data ? (
              <TeamForm
                key={query.data.id}
                team={query.data}
                reload={() => query.refetch()}
                units={units.data.items}
                people={users.data.items.map((u) => ({
                  value: u.id,
                  label: u.displayName,
                  parentValue: u.unitId,
                }))}
              />
            ) : (
              <Empty />
            )}
          </div>
        </div>
      )}
    </>
  );
}
