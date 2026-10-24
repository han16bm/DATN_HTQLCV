"use client";
import type { FormField, FormOption } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { Badge, Panel } from "@/components/ui/page";
import {
  createTeamSchema,
  updateTeamSchema,
} from "@/features/organization/schemas/team.schema";
import {
  type TeamDto,
  type UnitRow,
} from "@/features/organization/types/organization.types";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
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
  reload?: () => Promise<{
    data?: TeamDto;
  }>;
  onCreated?: (id: string) => void;
}) {
  const create = useCreateTeamMutation();
  const update = useUpdateTeamMutation();
  const deactivate = useDeactivateTeamMutation();
  const snapshot = useEditSnapshot(team);
  const base = snapshot.base;
  const [closing, setClosing] = useState(false);
  const fields: FormField[] = [
    { name: "name", label: "Tên nhóm", required: true },
    {
      name: "unitId",
      label: "Đơn vị",
      type: "select",
      required: true,
      options: units.map((u) => ({ value: u.id, label: u.name })),
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
  const formProps = {
    fields,
    defaults: team
      ? { name: team.name, unitId: team.unitId }
      : { unitId: units[0]?.id ?? "", memberIds: [] },
    onConflictReload: reload ? () => snapshot.load(reload) : undefined,
    onConflictAccept: snapshot.accept,
  };
  return (
    <>
      <Panel title={team ? `Thông tin ${team.name}` : "Tạo nhóm"}>
        {team && (
          <p className="metadata">
            <Badge value={team.status} />
          </p>
        )}
        {team?.status === "INACTIVE" ? (
          <p className="muted">
            Nhóm đã ngừng sử dụng, vẫn giữ thành viên và lịch sử.
          </p>
        ) : base ? (
          <SchemaForm
            {...formProps}
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
              toast.success("Đã lưu nhóm.");
            }}
          />
        ) : (
          <SchemaForm
            {...formProps}
            schema={createTeamSchema}
            onSubmit={async (values) => {
              const created = await create.mutateAsync(values);
              onCreated?.(created.id);

              toast.success("Đã lưu nhóm.");
            }}
          />
        )}
      </Panel>
      {team?.status === "ACTIVE" && (
        <Panel title="Thành viên nhóm">
          <p className="muted">
            Thay toàn bộ danh sách thành viên. Việc này không cấp hoặc thu hồi
            quyền dự án. Khi chuyển đơn vị, cần xử lý thành viên trước.
          </p>
          <TeamMembersForm
            key={team.id}
            team={team}
            people={people}
            reload={reload}
          />
          <div className="section-gap">
            <button className="danger" onClick={() => setClosing(!closing)}>
              Ngừng sử dụng nhóm
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
                    teamId: team.id,
                    payload: values,
                    version: team.version,
                  });
                  setClosing(false);
                  toast.success("Đã ngừng sử dụng nhóm.");
                }}
                submitLabel="Xác nhận ngừng sử dụng"
              />
            )}
          </div>
        </Panel>
      )}
    </>
  );
}
