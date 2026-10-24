"use client";
import type { FormField, FormOption } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { Badge, Panel } from "@/components/ui/page";
import {
  createUnitSchema,
  updateUnitSchema,
} from "@/features/organization/schemas/unit.schema";
import {
  type UnitDto,
  type UnitRow,
} from "@/features/organization/types/organization.types";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { reasonSchema } from "@/lib/validation/common.schema";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateUnitMutation,
  useDeactivateUnitMutation,
  useUpdateUnitMutation,
} from "../hooks/use-organization-mutations";
export function UnitForm({
  unit,
  units,
  users,
  reload,
  onCreated,
}: {
  unit?: UnitDto;
  units: UnitRow[];
  users: FormOption[];
  reload?: () => Promise<{
    data?: UnitDto;
  }>;
  onCreated?: (id: string) => void;
}) {
  const create = useCreateUnitMutation();
  const update = useUpdateUnitMutation();
  const deactivate = useDeactivateUnitMutation();
  const snapshot = useEditSnapshot(unit);
  const base = snapshot.base;
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
    fields,
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
      ) : base ? (
        <SchemaForm
          {...formProps}
          schema={updateUnitSchema}
          onSubmit={async (values) => {
            snapshot.saved(
              await update.mutateAsync({
                unitId: base.id,
                payload: updateUnitSchema.parse({
                  ...changedFields(base, values, [
                    "name",
                    "parentId",
                    "managerId",
                  ]),
                  reason: values.reason,
                }),
                version: base.version,
              }),
            );
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
