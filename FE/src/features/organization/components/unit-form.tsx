"use client";
import { Button } from "@/components/ui/button";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { ReasonForm } from "@/components/forms/reason-form";
import { DialogFooter } from "@/components/ui/entity-dialog";
import { changedFields } from "@/lib/format";
import type { DialogMode } from "@/lib/forms/use-entity-dialog";
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

// Một form cho Thêm/Xem/Sửa đơn vị; chế độ Xem disable mọi trường.
export function UnitForm({
  mode,
  unit,
  units,
  users,
  reload,
  onSaved,
  onCancel,
  onEdit,
  onClose,
}: {
  mode: DialogMode;
  unit?: UnitDto;
  units: UnitRow[];
  users: FormOption[];
  reload?: () => Promise<{ data?: UnitDto }>;
  onSaved: (id: string) => void;
  onCancel: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const create = useCreateUnitMutation();
  const update = useUpdateUnitMutation();
  const deactivate = useDeactivateUnitMutation();
  const snapshot = useEditSnapshot(unit);
  const [closing, setClosing] = useState(false);
  const editing = mode === "edit" && unit;
  const schema = editing ? updateUnitSchema.required() : createUnitSchema;
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues: unit
      ? {
          name: unit.name,
          parentId: unit.parentId,
          managerId: unit.managerId,
          ...(editing ? { reason: "" } : {}),
        }
      : { name: "", parentId: null, managerId: null },
  });
  const { errors } = form.formState;
  const parents = units
    .filter((value) => value.id !== unit?.id && value.status === "ACTIVE")
    .map((value) => ({ value: value.id, label: value.name }));
  // Có ID nhưng thiếu nhãn (tài khoản đã khóa, ngoài lookup) thì không coi là trống.
  const missingManager =
    unit?.managerId && !users.some((u) => u.value === unit.managerId);
  if (closing && unit)
    return (
      <ReasonForm
        label="Lý do ngừng sử dụng"
        cancel={
          <Button type="button" onClick={() => setClosing(false)}>
            Hủy
          </Button>
        }
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
          setClosing(false);
          toast.success("Đã ngừng sử dụng đơn vị.");
        }}
      />
    );
  return (
    <>
      <Form
        form={form}
        readOnly={mode === "view"}
        cancel={
          <Button type="button" onClick={onCancel}>
            Hủy
          </Button>
        }
        submitLabel={editing ? "Lưu thông tin" : "Thêm đơn vị"}
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
            });
            toast.success("Đã lưu đơn vị.");
            onSaved(base.id);
          } else {
            const result = await create.mutateAsync(values);
            toast.success("Đã thêm đơn vị.");
            onSaved(result.id);
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
          hint={
            missingManager ? "Chưa tải được thông tin người quản lý" : undefined
          }
          {...form.register("managerId", {
            setValueAs: (value: string) => value || null,
          })}
          error={errors.managerId}
        />
        {editing && (
          <FormTextarea
            label="Lý do thay đổi"
            required
            {...form.register("reason")}
            error={form.getFieldState("reason", form.formState).error}
          />
        )}
      </Form>
      {mode === "view" && unit && (
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Đóng
          </Button>
          {unit.status === "ACTIVE" && (
            <>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  snapshot.saved(unit);
                  setClosing(true);
                }}
              >
                Ngừng sử dụng đơn vị
              </Button>
              <Button type="button" variant="primary" onClick={onEdit}>
                Chỉnh sửa
              </Button>
            </>
          )}
        </DialogFooter>
      )}
    </>
  );
}
