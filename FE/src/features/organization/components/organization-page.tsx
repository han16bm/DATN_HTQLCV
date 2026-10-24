"use client";
import type { FormField } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import {
  Badge,
  ButtonLink,
  Empty,
  Loading,
  PageHeader,
  Pagination,
  Panel,
  PermissionGate,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import {
  createUnitSchema,
  updateUnitSchema,
} from "@/features/organization/schemas/unit.schema";
import { type UnitDto } from "@/features/organization/types/organization.types";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { reasonSchema } from "@/lib/validation/common.schema";
import { useUI } from "@/stores/ui-store";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateUnitMutation,
  useDeactivateUnitMutation,
  useUpdateUnitMutation,
} from "../hooks/use-organization-mutations";
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
    enabled: Boolean(selectedId && selectedId !== "new"),
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
function UnitForm({
  unit,
  units,
  users,
  reload,
  onCreated,
}: {
  unit?: UnitDto;
  units: UnitDto[];
  users: {
    value: string;
    label: string;
  }[];
  reload?: () => Promise<{
    data?: UnitDto;
  }>;
  onCreated?: (id: string) => void;
}) {
  const create = useCreateUnitMutation();
  const update = useUpdateUnitMutation();
  const deactivate = useDeactivateUnitMutation();
  const snapshot = useEditSnapshot(unit);
  const [closing, setClosing] = useState(false);
  const fields: FormField[] = [
    { name: "name", label: "Tên đơn vị", required: true },
    {
      name: "parentId",
      label: "Đơn vị cấp trên",
      type: "select",
      nullable: true,
      options: units
        .filter((u) => u.id !== unit?.id && u.status === "ACTIVE")
        .map((u) => ({ value: u.id, label: u.name })),
    },
    {
      name: "managerId",
      label: "Người quản lý",
      type: "select",
      nullable: true,
      options: users,
    },
    ...(unit
      ? [
          {
            name: "reason",
            label: "Lý do thay đổi",
            type: "textarea" as const,
            required: true,
          },
        ]
      : []),
  ];
  const formProps = {
    fields: fields,
    defaults: unit
      ? {
          name: unit.name,
          parentId: unit.parentId ?? "",
          managerId: unit.managerId ?? "",
        }
      : { parentId: "", managerId: "" },
    onConflictReload: reload ? () => snapshot.load(reload) : undefined,
    onConflictAccept: snapshot.accept,
  };
  return (
    <Panel title={unit ? `Thông tin ${unit.name}` : "Thêm đơn vị"}>
      {unit && (
        <p className="metadata">
          <Badge value={unit.status} />
        </p>
      )}
      {unit?.status === "INACTIVE" ? (
        <p className="muted">
          Đơn vị đã ngừng sử dụng. Lịch sử và liên kết được bảo toàn.
        </p>
      ) : unit ? (
        <SchemaForm
          {...formProps}
          schema={updateUnitSchema}
          onSubmit={async (values) => {
            if (unit && snapshot.base) {
              snapshot.saved(
                await update.mutateAsync({
                  unitId: unit.id,
                  payload: updateUnitSchema.parse({
                    ...changedFields(snapshot.base, values, [
                      "name",
                      "parentId",
                      "managerId",
                    ]),
                    reason: values.reason,
                  }),
                  version: snapshot.base.version,
                }),
              );
            }
            toast.success("Đã lưu đơn vị.");
          }}
        />
      ) : (
        <SchemaForm
          {...formProps}
          schema={createUnitSchema}
          onSubmit={async (values) => {
            const created = await create.mutateAsync(values);
            onCreated?.(created.id);

            toast.success("Đã lưu đơn vị.");
          }}
        />
      )}
      {unit?.status === "ACTIVE" && (
        <div className="section-gap">
          <button className="danger" onClick={() => setClosing(!closing)}>
            Ngừng sử dụng đơn vị
          </button>
          {closing && (
            <SchemaForm
              schema={reasonSchema}
              fields={[
                {
                  name: "reason",
                  label: "Lý do ngừng sử dụng",
                  type: "textarea",
                  required: true,
                },
              ]}
              onSubmit={async (values) => {
                await deactivate.mutateAsync({
                  unitId: unit.id,
                  payload: values,
                  version: unit.version,
                });
                setClosing(false);
                toast.success("Đã ngừng sử dụng đơn vị.");
              }}
              submitLabel="Xác nhận ngừng sử dụng"
            />
          )}
        </div>
      )}
    </Panel>
  );
}
