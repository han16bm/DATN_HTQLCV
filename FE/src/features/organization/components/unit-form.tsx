"use client";

import { Form } from "@/components/forms/form";
import { Button } from "@/components/ui/button";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { ReasonForm } from "@/components/forms/reason-form";
import { StatusField, ButtonLink, Panel } from "@/components/ui/page";
import { changedFields } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  useCreateUnitMutation,
  useDeactivateUnitMutation,
  useUpdateUnitMutation,
} from "../hooks/use-organization-mutations";
import { createUnitSchema, updateUnitSchema } from "../schemas/unit.schema";
import type { UnitDto, UnitRow } from "../types/organization.types";

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

  const [mode, setMode] = useState<"edit" | "close" | null>(null);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ các thay đổi chưa lưu trong đơn vị?")))
      return;
    form.reset(defaults);
    setMode(null);
  };
  const schema = unit ? updateUnitSchema.required() : createUnitSchema;
  type Values = z.input<typeof schema>;
  const defaults: Values = unit
    ? {
        name: unit.name,
        parentId: unit.parentId,
        managerId: unit.managerId,
        reason: "",
      }
    : { name: "", parentId: null, managerId: null };
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues: defaults,
  });
  const { errors } = form.formState;
  const parents = units
    .filter((value) => value.id !== unit?.id && value.status === "ACTIVE")
    .map((value) => ({ value: value.id, label: value.name }));
  const cancelButton = unit ? (
    <Button type="button" onClick={cancel}>
      Hủy
    </Button>
  ) : (
    <ButtonLink href="/admin/organization">Hủy</ButtonLink>
  );
  const commands = unit?.status === "ACTIVE" && mode === null && (
    <>
      <Button
        type="button"
        onClick={() => {
          snapshot.saved(unit);
          form.reset(defaults);
          setMode("edit");
        }}
      >
        Chỉnh sửa
      </Button>
      <Button
        variant="danger"
        type="button"
        onClick={() => {
          snapshot.saved(unit);
          setMode("close");
        }}
      >
        Ngừng sử dụng đơn vị
      </Button>
    </>
  );
  return (
    <Panel
      className="max-w-[880px]"
      title={unit ? unit.name : "Thông tin đơn vị"}
      actions={
        unit && (
          <div className="actions flex flex-wrap items-center gap-2">
            <StatusField value={unit.status} />
            {commands}
          </div>
        )
      }
    >
      {!unit || mode === "edit" ? (
        <Form
          compact={!unit}
          form={form}
          cancel={cancelButton}
          submitLabel={unit ? "Lưu thông tin" : "Thêm đơn vị"}
          compareFields={[
            { name: "name", label: "Tên đơn vị" },
            { name: "parentId", label: "Đơn vị cấp trên", options: parents },
            { name: "managerId", label: "Người quản lý", options: users },
          ]}
          onConflictReload={reload ? () => snapshot.load(reload) : undefined}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            if ("reason" in values) {
              const base = snapshot.base!;
              snapshot.saved(
                await update.mutateAsync({
                  unitId: base.id,
                  payload: {
                    ...changedFields(base, values, [
                      "name",
                      "parentId",
                      "managerId",
                    ]),
                    reason: values.reason,
                  },
                  version: base.version,
                }),
              );
              setMode(null);
              toast.success("Đã lưu đơn vị.");
            } else {
              const result = await create.mutateAsync(values);
              toast.success("Đã thêm đơn vị.");
              onCreated?.(result.id);
            }
          }}
        >
          <FormInput
            label="Tên đơn vị"
            required
            width="full"
            {...form.register("name")}
            error={errors.name}
          />
          <FormSelect
            label="Đơn vị cấp trên"
            options={parents}
            {...form.register("parentId", {
              setValueAs: (value: string) => value || null,
            })}
            error={errors.parentId}
          />
          <FormSelect
            label="Người quản lý"
            options={users}
            {...form.register("managerId", {
              setValueAs: (value: string) => value || null,
            })}
            error={errors.managerId}
          />
          {unit && (
            <FormTextarea
              label="Lý do thay đổi"
              required
              {...form.register("reason")}
              error={form.getFieldState("reason", form.formState).error}
            />
          )}
        </Form>
      ) : mode === "close" ? (
        <ReasonForm
          label="Lý do ngừng sử dụng"
          cancel={cancelButton}
          submitLabel="Xác nhận ngừng sử dụng"
          compareFields={[
            { name: "name", label: "Tên đơn vị" },
            { name: "status", label: "Trạng thái" },
          ]}
          onConflictReload={reload ? () => snapshot.load(reload) : undefined}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            await deactivate.mutateAsync({
              unitId: unit.id,
              payload: values,
              version: snapshot.base!.version,
            });
            setMode(null);
            toast.success("Đã ngừng sử dụng đơn vị.");
          }}
        />
      ) : (
        <>
          <dl className="m-0 grid gap-y-2 text-sm [&>div]:grid [&>div]:grid-cols-[7rem_minmax(0,1fr)] [&>div]:items-baseline [&>div]:gap-x-3 [&_dt]:text-fg-subtle [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:text-left [&_dd]:break-words">
            <div>
              <dt>Đơn vị cấp trên</dt>
              <dd>
                {unit.parentId
                  ? (units.find((value) => value.id === unit.parentId)?.name ??
                    "Chưa tải được thông tin đơn vị cấp trên")
                  : "Không có"}
              </dd>
            </div>
            <div>
              <dt>Người quản lý</dt>
              <dd>
                {unit.managerId
                  ? (users.find((value) => value.value === unit.managerId)
                      ?.label ?? "Chưa tải được thông tin người quản lý")
                  : "Chưa phân công"}
              </dd>
            </div>
          </dl>
        </>
      )}
    </Panel>
  );
}
