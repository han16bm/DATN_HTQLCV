"use client";
import type { FormField } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import {
  Badge,
  ButtonLink,
  Empty,
  Loading,
  PageHeader,
  Panel,
  PermissionGate,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import {
  createTeamSchema,
  teamMembersSchema,
  updateTeamSchema,
} from "@/features/organization/schemas/team.schema";
import {
  type TeamDto,
  type UnitDto,
} from "@/features/organization/types/organization.types";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { changedFields } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { reasonSchema } from "@/lib/validation/common.schema";
import { useUI } from "@/stores/ui-store";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateTeamMutation,
  useDeactivateTeamMutation,
  useReplaceTeamMembersMutation,
  useUpdateTeamMutation,
} from "../hooks/use-organization-mutations";
import {
  useGetTeamQuery,
  useListTeamsQuery,
  useListUnitsQuery,
} from "../hooks/use-organization-queries";

type PersonOption = {
  value: string;
  label: string;
  parentValue: string;
};
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
  const query = useGetTeamQuery(id, { enabled: Boolean(id && id !== "new") });
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
                    · {t.memberIds.length} thành viên
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
function TeamForm({
  team,
  units,
  people,
  reload,
  onCreated,
}: {
  team?: TeamDto;
  units: UnitDto[];
  people: PersonOption[];
  reload?: () => Promise<{
    data?: TeamDto;
  }>;
  onCreated?: (id: string) => void;
}) {
  const create = useCreateTeamMutation();
  const update = useUpdateTeamMutation();
  const deactivate = useDeactivateTeamMutation();
  const snapshot = useEditSnapshot(team);
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
    fields: fields,
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
        ) : team ? (
          <SchemaForm
            {...formProps}
            schema={updateTeamSchema}
            onSubmit={async (values) => {
              if (team && snapshot.base) {
                snapshot.saved(
                  await update.mutateAsync({
                    teamId: team.id,
                    payload: updateTeamSchema.parse({
                      ...changedFields(snapshot.base, values, [
                        "name",
                        "unitId",
                      ]),
                      reason: values.reason,
                    }),
                    version: snapshot.base.version,
                  }),
                );
              }
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
function TeamMembersForm({
  team,
  people,
  reload,
}: {
  team: TeamDto;
  people: PersonOption[];
  reload?: () => Promise<{
    data?: TeamDto;
  }>;
}) {
  const snapshot = useEditSnapshot(team);
  const mutation = useReplaceTeamMembersMutation();
  return (
    <SchemaForm
      schema={teamMembersSchema}
      fields={[
        {
          name: "memberIds",
          label: "Thành viên",
          type: "multi",
          options: people.filter((p) => p.parentValue === snapshot.base.unitId),
        },
        {
          name: "reason",
          label: "Lý do thay đổi thành viên",
          type: "textarea",
          required: true,
        },
      ]}
      defaults={{ memberIds: team.memberIds }}
      onConflictReload={reload ? () => snapshot.load(reload) : undefined}
      onConflictAccept={snapshot.accept}
      onSubmit={async (values) => {
        snapshot.saved(
          await mutation.mutateAsync({
            teamId: team.id,
            payload: values,
            version: snapshot.base.version,
          }),
        );
        toast.success("Đã cập nhật thành viên nhóm.");
      }}
      submitLabel="Lưu thành viên"
    />
  );
}
