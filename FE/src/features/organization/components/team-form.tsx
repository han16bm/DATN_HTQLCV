"use client";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormMultiSelect,
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
  team,
  units,
  people,
  reload,
  onCreated,
}: {
  team?: TeamDto;
  units: UnitRow[];
  people: FormOption[];
  reload?: () => Promise<{ data?: TeamDto }>;
  onCreated?: (id: string) => void;
}) {
  const create = useCreateTeamMutation();
  const update = useUpdateTeamMutation();
  const deactivate = useDeactivateTeamMutation();
  const snapshot = useEditSnapshot(team);

  const [mode, setMode] = useState<"info" | "members" | "close" | null>(null);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ các thay đổi chưa lưu trong nhóm?"))) return;
    form.reset(defaults);
    setMode(null);
  };
  const activeUnits = units.filter((unit) => unit.status === "ACTIVE");
  const schema = team ? updateTeamSchema.required() : createTeamSchema;
  type Values = z.input<typeof schema>;
  const defaults: Values = team
    ? { name: team.name, unitId: team.unitId, reason: "" }
    : { name: "", unitId: activeUnits[0]?.id ?? "", memberIds: [] };
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues: defaults,
  });
  const unitId = useWatch({ control: form.control, name: "unitId" });
  const { errors } = form.formState;
  const names = team
    ? people
        .filter((person) => team.memberIds.includes(person.value))
        .slice(0, 3)
        .map((person) => person.label)
    : [];
  const cancelButton = (
    <button type="button" onClick={cancel}>
      Hủy
    </button>
  );
  const commands = team?.status === "ACTIVE" && mode === null && (
    <>
      <button
        type="button"
        onClick={() => {
          snapshot.saved(team);
          form.reset(defaults);
          setMode("info");
        }}
      >
        Chỉnh sửa thông tin
      </button>
      <button type="button" onClick={() => setMode("members")}>
        Chọn thành viên
      </button>
      <button
        type="button"
        className="danger"
        onClick={() => {
          snapshot.saved(team);
          setMode("close");
        }}
      >
        Ngừng sử dụng nhóm
      </button>
    </>
  );
  return (
    <Panel
      className="record-card"
      title={team ? team.name : "Thông tin nhóm"}
      actions={
        team && (
          <div className="actions">
            <StatusField value={team.status} />
            {commands}
          </div>
        )
      }
    >
      {!team || mode === "info" ? (
        <Form
          compact
          form={form}
          cancel={
            team ? (
              cancelButton
            ) : (
              <ButtonLink href="/admin/teams">Hủy</ButtonLink>
            )
          }
          submitLabel={team ? "Lưu thông tin" : "Tạo nhóm"}
          compareFields={[
            { name: "name", label: "Tên nhóm" },
            {
              name: "unitId",
              label: "Đơn vị",
              options: activeUnits.map((unit) => ({
                value: unit.id,
                label: unit.name,
              })),
            },
          ]}
          onConflictReload={reload ? () => snapshot.load(reload) : undefined}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            if ("reason" in values) {
              const base = snapshot.base!;
              snapshot.saved(
                await update.mutateAsync({
                  teamId: base.id,
                  payload: {
                    ...changedFields(base, values, ["name", "unitId"]),
                    reason: values.reason,
                  },
                  version: base.version,
                }),
              );
              setMode(null);
              toast.success("Đã lưu nhóm.");
            } else {
              const result = await create.mutateAsync(values);
              toast.success("Đã tạo nhóm.");
              onCreated?.(result.id);
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
            options={activeUnits.map((unit) => ({
              value: unit.id,
              label: unit.name,
            }))}
            {...form.register("unitId", {
              onChange: !team
                ? () => form.setValue("memberIds", [], { shouldDirty: true })
                : undefined,
            })}
            error={errors.unitId}
          />
          {team ? (
            <FormTextarea
              label="Lý do thay đổi"
              required
              {...form.register("reason")}
              error={form.getFieldState("reason", form.formState).error}
            />
          ) : (
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
      ) : mode === "members" ? (
        <TeamMembersForm
          team={team}
          people={people}
          reload={reload}
          cancel={cancelButton}
          onDone={() => setMode(null)}
        />
      ) : mode === "close" ? (
        <ReasonForm
          label="Lý do ngừng sử dụng"
          cancel={cancelButton}
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
            setMode(null);
            toast.success("Đã ngừng sử dụng nhóm.");
          }}
        />
      ) : (
        <>
          <dl className="record-details">
            <div>
              <dt>Đơn vị</dt>
              <dd>
                {units.find((unit) => unit.id === team.unitId)?.name ??
                  "Chưa tải được thông tin đơn vị"}
              </dd>
            </div>
            <div>
              <dt>Số thành viên</dt>
              <dd>{team.memberIds.length}</dd>
            </div>
          </dl>
          <p className="small muted member-summary">
            {names.join(", ") ||
              (team.memberIds.length
                ? `${team.memberIds.length} thành viên`
                : "Chưa có thành viên")}
            {names.length && team.memberIds.length > names.length
              ? ` và ${team.memberIds.length - names.length} thành viên khác`
              : ""}
          </p>
        </>
      )}
    </Panel>
  );
}
