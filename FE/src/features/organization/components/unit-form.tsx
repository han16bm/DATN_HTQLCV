"use client";
import type { FormField, FormOption } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { Badge, ButtonLink, Panel } from "@/components/ui/page";
import {
  createUnitSchema,
  updateUnitSchema,
} from "@/features/organization/schemas/unit.schema";
import type {
  UnitDto,
  UnitRow,
} from "@/features/organization/types/organization.types";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
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
  reload?: () => Promise<{ data?: UnitDto }>;
  onCreated?: (id: string) => void;
}) {
  const create = useCreateUnitMutation();
  const update = useUpdateUnitMutation();
  const deactivate = useDeactivateUnitMutation();
  const snapshot = useEditSnapshot(unit);
  const base = snapshot.base;
  const [mode, setMode] = useState<"edit" | "close" | null>(null);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ các thay đổi chưa lưu trong đơn vị?")))
      return;
    setMode(null);
  };
  const fields: FormField[] = [
    { name: "name", label: "Tên đơn vị", required: true, width: "full" },
    {
      name: "parentId",
      label: "Đơn vị cấp trên",
      type: "select",
      nullable: true,
      options: units
        .filter((value) => value.id !== unit?.id && value.status === "ACTIVE")
        .map((value) => ({ value: value.id, label: value.name })),
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
  const props = {
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
    cancel: unit ? (
      <button type="button" onClick={cancel}>
        Hủy
      </button>
    ) : (
      <ButtonLink href="/admin/organization">Hủy</ButtonLink>
    ),
  };
  return (
    <Panel
      title={unit ? unit.name : "Thông tin đơn vị"}
      actions={unit && <Badge value={unit.status} />}
    >
      {!unit ? (
        <SchemaForm
          {...props}
          schema={createUnitSchema}
          submitLabel="Thêm đơn vị"
          onSubmit={async (values) => {
            const result = await create.mutateAsync(values);
            toast.success("Đã thêm đơn vị.");
            onCreated?.(result.id);
          }}
        />
      ) : mode === "edit" && base ? (
        <SchemaForm
          {...props}
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
            setMode(null);
            toast.success("Đã lưu đơn vị.");
          }}
        />
      ) : mode === "close" ? (
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
          cancel={props.cancel}
          submitLabel="Xác nhận ngừng sử dụng"
          onSubmit={async (values) => {
            await deactivate.mutateAsync({
              unitId: unit.id,
              payload: values,
              version: unit.version,
            });
            setMode(null);
            toast.success("Đã ngừng sử dụng đơn vị.");
          }}
        />
      ) : (
        <>
          <dl className="record-details">
            <div>
              <dt>Đơn vị cấp trên</dt>
              <dd>
                {units.find((value) => value.id === unit.parentId)?.name ??
                  "Không có"}
              </dd>
            </div>
            <div>
              <dt>Người quản lý</dt>
              <dd>
                {users.find((value) => value.value === unit.managerId)?.label ??
                  "Chưa phân công"}
              </dd>
            </div>
          </dl>
          {unit.status === "ACTIVE" && (
            <div className="record-actions">
              <button
                type="button"
                onClick={() => {
                  snapshot.saved(unit);
                  setMode("edit");
                }}
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => setMode("close")}
              >
                Ngừng sử dụng đơn vị
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
