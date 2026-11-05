"use client";
import { Button } from "@/components/ui/button";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormMultiSelect,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { ReasonForm } from "@/components/forms/reason-form";
import { DialogFooter, DialogTabs } from "@/components/ui/entity-dialog";
import { changedFields } from "@/lib/format";
import type { DialogMode } from "@/lib/forms/use-entity-dialog";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  useCreateTeamMutation,
  useDeactivateTeamMutation,
  useUpdateTeamMutation,
} from "../hooks/use-organization-mutations";
import { createTeamSchema, updateTeamSchema } from "../schemas/team.schema";
import type { TeamDto, UnitRow } from "../types/organization.types";
import { TeamMembersForm } from "./team-members-form";

export function TeamForm({
  mode,
  team,
  units,
  people,
  reload,
  onSaved,
  onCancel,
  onEdit,
  onClose,
}: {
  mode: DialogMode;
  team?: TeamDto;
  units: UnitRow[];
  people: FormOption[];
  reload?: () => Promise<{ data?: TeamDto }>;
  onSaved: (id: string) => void;
  onCancel: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const create = useCreateTeamMutation();
  const update = useUpdateTeamMutation();
  const deactivate = useDeactivateTeamMutation();
  const snapshot = useEditSnapshot(team);
  const [tab, setTab] = useState<"info" | "members">("info");
  const [closing, setClosing] = useState(false);
  const activeUnits = units.filter((unit) => unit.status === "ACTIVE");
  const unitOptions = (team ? units : activeUnits).map((unit) => ({
    value: unit.id,
    label: unit.name,
  }));
  const editing = mode === "edit" && team;
  const schema = editing ? updateTeamSchema.required() : createTeamSchema;
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues: team
      ? {
          name: team.name,
          unitId: team.unitId,
          ...(editing ? { reason: "" } : {}),
        }
      : { name: "", unitId: activeUnits[0]?.id ?? "", memberIds: [] },
  });
  const unitId = useWatch({ control: form.control, name: "unitId" });
  const { errors } = form.formState;
  const cancel = (
    <Button type="button" onClick={onCancel}>
      Hủy
    </Button>
  );
  if (closing && team)
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
          { name: "name", label: "Tên nhóm" },
          { name: "status", label: "Trạng thái" },
        ]}
        onConflictReload={reload ? () => snapshot.load(reload) : undefined}
        onConflictAccept={snapshot.accept}
        onSubmit={async (values) => {
          await deactivate.mutateAsync({
            teamId: team.id,
            payload: values,
            version: snapshot.base!.version,
          });
          setClosing(false);
          toast.success("Đã ngừng sử dụng nhóm.");
        }}
      />
    );
  const footer = mode === "view" && team && (
    <DialogFooter>
      <Button type="button" onClick={onClose}>
        Đóng
      </Button>
      {team.status === "ACTIVE" && (
        <>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              snapshot.saved(team);
              setClosing(true);
            }}
          >
            Ngừng sử dụng nhóm
          </Button>
          <Button type="button" variant="primary" onClick={onEdit}>
            Chỉnh sửa
          </Button>
        </>
      )}
    </DialogFooter>
  );
  return (
    <>
      {team && (
        <DialogTabs
          label="Mục nhóm"
          value={tab}
          onChange={setTab}
          items={[
            { value: "info", label: "Thông tin" },
            { value: "members", label: "Thành viên" },
          ]}
        />
      )}
      {team && tab === "members" ? (
        <TeamMembersForm
          team={team}
          people={people}
          reload={reload}
          readOnly={mode === "view"}
          cancel={cancel}
          onDone={() => onSaved(team.id)}
        />
      ) : (
        <Form
          form={form}
          readOnly={mode === "view"}
          cancel={cancel}
          submitLabel={editing ? "Lưu thông tin" : "Tạo nhóm"}
          compareFields={[
            { name: "name", label: "Tên nhóm" },
            { name: "unitId", label: "Đơn vị", options: unitOptions },
          ]}
          onConflictReload={reload ? () => snapshot.load(reload) : undefined}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            if ("reason" in values) {
              const base = snapshot.base!;
              await update.mutateAsync({
                teamId: base.id,
                payload: {
                  ...changedFields(base, values, ["name", "unitId"]),
                  reason: values.reason,
                },
                version: base.version,
              });
              toast.success("Đã lưu nhóm.");
              onSaved(base.id);
            } else {
              const result = await create.mutateAsync(values);
              toast.success("Đã tạo nhóm.");
              onSaved(result.id);
            }
          }}
        >
          <FormInput
            label="Tên nhóm"
            required
            {...form.register("name")}
            error={errors.name}
          />
          <FormSelect
            label="Đơn vị"
            required
            options={unitOptions}
            hint={
              team
                ? team.memberIds.length
                  ? `${team.memberIds.length} thành viên`
                  : "Chưa có thành viên"
                : undefined
            }
            {...form.register("unitId", {
              onChange: !team
                ? () => form.setValue("memberIds", [], { shouldDirty: true })
                : undefined,
            })}
            error={errors.unitId}
          />
          {editing && (
            <FormTextarea
              label="Lý do thay đổi"
              required
              {...form.register("reason")}
              error={form.getFieldState("reason", form.formState).error}
            />
          )}
          {!team && (
            <Controller
              name="memberIds"
              control={form.control}
              render={({ field }) => (
                <FormMultiSelect
                  label="Thành viên"
                  options={people.filter(
                    (person) => person.parentValue === unitId,
                  )}
                  {...field}
                  error={form.getFieldState("memberIds", form.formState).error}
                />
              )}
            />
          )}
        </Form>
      )}
      {footer}
    </>
  );
}
