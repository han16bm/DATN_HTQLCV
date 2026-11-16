"use client";

import { EntityDialog } from "@/components/ui/entity-dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { StatusField } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { RecordStamp } from "@/components/ui/record-stamp";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import {
  useGetTeamQuery,
  useListUnitsQuery,
} from "../hooks/use-organization-queries";
import { TeamForm } from "./team-form";

export function TeamDialog() {
  const dialog = useEntityDialog();
  if (!dialog.mode) return null;
  return <TeamDialogBody key={`${dialog.mode}:${dialog.id}`} />;
}

function TeamDialogBody() {
  const dialog = useEntityDialog();
  const mode = dialog.mode!;
  const query = useGetTeamQuery(dialog.id);
  const units = useListUnitsQuery({ pageSize: 100 });
  const users = useListUsersQuery({ pageSize: 100, status: "ACTIVE" });
  const team = query.data;
  const failed = [query, units, users].find((item) => item.isError);
  return (
    <EntityDialog
      open
      title={mode === "create" ? "Tạo nhóm" : (team?.name ?? "Nhóm")}
      status={team && <StatusField value={team.status} />}
      stamp={
        team && (
          <RecordStamp
            createdBy={team.createdBy}
            createdAt={team.createdAt}
            updatedBy={team.updatedBy}
            updatedAt={team.updatedAt}
          />
        )
      }
      onClose={dialog.close}
    >
      {failed?.error ? (
        <QueryErrorState error={failed.error} retry={failed.refetch} />
      ) : !units.data || !users.data || (mode !== "create" && !team) ? (
        <PageSkeleton variant="form" />
      ) : (
        <TeamForm
          mode={mode}
          team={team}
          units={units.data.items}
          people={users.data.items.map((user) => ({
            value: user.id,
            label: user.displayName,
            parentValue: user.unitId,
          }))}
          reload={() => query.refetch()}
          onSaved={(id) => dialog.switchTo("view", id)}
          onCancel={async () => {
            if (!(await confirmDiscard())) return;
            if (mode === "edit") dialog.switchTo("view", dialog.id);
            else dialog.close();
          }}
          onEdit={() => dialog.switchTo("edit", dialog.id)}
          onClose={dialog.close}
        />
      )}
    </EntityDialog>
  );
}
