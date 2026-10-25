"use client";
import type { FormField, FormOption } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { Badge, ButtonLink, Panel } from "@/components/ui/page";
import {
  createTeamSchema,
  updateTeamSchema,
} from "@/features/organization/schemas/team.schema";
import type {
  TeamDto,
  UnitRow,
} from "@/features/organization/types/organization.types";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { reasonSchema } from "@/lib/validation/common.schema";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateTeamMutation,
  useDeactivateTeamMutation,
  useUpdateTeamMutation,
} from "../hooks/use-organization-mutations";
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
  const base = snapshot.base;
  const [mode, setMode] = useState<"info" | "members" | "close" | null>(null);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ các thay đổi chưa lưu trong nhóm?"))) return;
    setMode(null);
  };
  const activeUnits = units.filter((unit) => unit.status === "ACTIVE");
  const fields: FormField[] = [
    { name: "name", label: "Tên nhóm", required: true },
    {
      name: "unitId",
      label: "Đơn vị",
      type: "select",
      required: true,
      options: activeUnits.map((unit) => ({
        value: unit.id,
        label: unit.name,
      })),
    },
    ...(team
      ? [
          {
            name: "reason",
            label: "Lý do thay đổi",
            type: "textarea" as const,
            required: true,
          },
        ]
      : [
          {
            name: "memberIds",
            label: "Thành viên",
            type: "multi" as const,
            dependsOn: "unitId",
            options: people,
          },
        ]),
  ];
  const cancelButton = (
    <button type="button" onClick={cancel}>
      Hủy
    </button>
  );
  const props = {
    fields,
    defaults: team
      ? { name: team.name, unitId: team.unitId }
      : { unitId: activeUnits[0]?.id ?? "", memberIds: [] },
    onConflictReload: reload ? () => snapshot.load(reload) : undefined,
    onConflictAccept: snapshot.accept,
    cancel: team ? (
      cancelButton
    ) : (
      <ButtonLink href="/admin/teams">Hủy</ButtonLink>
    ),
  };
  return (
    <Panel
      title={team ? team.name : "Tạo nhóm"}
      actions={team && <Badge value={team.status} />}
    >
      {!team ? (
        <SchemaForm
          {...props}
          schema={createTeamSchema}
          submitLabel="Tạo nhóm"
          onSubmit={async (values) => {
            const result = await create.mutateAsync(values);
            toast.success("Đã tạo nhóm.");
            onCreated?.(result.id);
          }}
        />
      ) : mode === "info" && base ? (
        <SchemaForm
          {...props}
          schema={updateTeamSchema}
          onSubmit={async (values) => {
            snapshot.saved(
              await update.mutateAsync({
                teamId: base.id,
                payload: updateTeamSchema.parse({
                  ...changedFields(base, values, ["name", "unitId"]),
                  reason: values.reason,
                }),
                version: base.version,
              }),
            );
            setMode(null);
            toast.success("Đã lưu nhóm.");
          }}
        />
      ) : mode === "members" ? (
        <TeamMembersForm
          team={team}
          people={people}
          reload={reload}
          cancel={cancelButton}
          onDone={() => setMode(null)}
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
          cancel={cancelButton}
          submitLabel="Xác nhận ngừng sử dụng"
          onSubmit={async (values) => {
            await deactivate.mutateAsync({
              teamId: team.id,
              payload: values,
              version: team.version,
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
                  "Đơn vị đã ngừng sử dụng"}
              </dd>
            </div>
            <div>
              <dt>Số thành viên</dt>
              <dd>{team.memberIds.length}</dd>
            </div>
          </dl>
          <p className="small muted member-summary">
            {people
              .filter((person) => team.memberIds.includes(person.value))
              .slice(0, 3)
              .map((person) => person.label)
              .join(", ") || "Chưa có thành viên"}
            {team.memberIds.length > 3
              ? ` và ${team.memberIds.length - 3} thành viên khác`
              : ""}
          </p>
          {team.status === "ACTIVE" && (
            <div className="record-actions">
              <button
                type="button"
                onClick={() => {
                  snapshot.saved(team);
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
                onClick={() => setMode("close")}
              >
                Ngừng sử dụng nhóm
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
