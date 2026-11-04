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
  useGetUnitQuery,
  useListUnitsQuery,
} from "../hooks/use-organization-queries";
import { UnitForm } from "./unit-form";

// Dialog Thêm/Xem/Sửa đơn vị theo ?dialog=…&id=… (ADMIN_MODULES 9).
export function UnitDialog() {
  const dialog = useEntityDialog();
  if (!dialog.mode) return null;
  return <UnitDialogBody key={`${dialog.mode}:${dialog.id}`} />;
}

function UnitDialogBody() {
  const dialog = useEntityDialog();
  const mode = dialog.mode!;
  const query = useGetUnitQuery(dialog.id);
  const units = useListUnitsQuery({ pageSize: 100 });
  const users = useListUsersQuery({ pageSize: 100, status: "ACTIVE" });
  const unit = query.data;
  const failed = [query, units, users].find((item) => item.isError);
  return (
    <EntityDialog
      open
      title={mode === "create" ? "Thêm đơn vị" : (unit?.name ?? "Đơn vị")}
      status={unit && <StatusField value={unit.status} />}
      stamp={
        unit && (
          <RecordStamp
            createdBy={unit.createdBy}
            createdAt={unit.createdAt}
            updatedBy={unit.updatedBy}
            updatedAt={unit.updatedAt}
          />
        )
      }
      onClose={dialog.close}
    >
      {failed?.error ? (
        <QueryErrorState error={failed.error} retry={failed.refetch} />
      ) : !units.data || !users.data || (mode !== "create" && !unit) ? (
        <PageSkeleton variant="form" />
      ) : (
        <UnitForm
          mode={mode}
          unit={unit}
          units={units.data.items}
          users={users.data.items.map((user) => ({
            value: user.id,
            label: user.displayName,
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
