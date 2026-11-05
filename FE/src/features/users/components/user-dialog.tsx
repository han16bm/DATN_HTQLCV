"use client";
import { Button } from "@/components/ui/button";

import {
  DialogFooter,
  DialogTabs,
  EntityDialog,
} from "@/components/ui/entity-dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { RecordStamp } from "@/components/ui/record-stamp";
import { useListUnitsQuery } from "@/features/organization/hooks/use-organization-queries";
import { useListPermissionGroupsQuery } from "@/features/permissions/hooks/use-permissions-queries";
import { hasPermission } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { useState } from "react";
import { useGetUserQuery } from "../hooks/use-users-queries";
import { UserCommands } from "./user-commands";
import { UserPermissionsPanel } from "./user-permissions-panel";
import { UserProjectsPanel } from "./user-projects-panel";
import { UserProfileForm } from "./user-profile-form";

export function UserDialog() {
  const dialog = useEntityDialog();
  if (!dialog.mode) return null;
  return <UserDialogBody key={`${dialog.mode}:${dialog.id}`} />;
}

function UserDialogBody() {
  const dialog = useEntityDialog();
  const mode = dialog.mode!;
  const { session } = useSession();
  const [tab, setTab] = useState<"info" | "permissions" | "projects">("info");
  const query = useGetUserQuery(dialog.id);
  const units = useListUnitsQuery({ pageSize: 100, status: "ACTIVE" });
  const permissions = hasPermission(session, "PERMISSIONS_MANAGE");
  const tabs = [
    { value: "info" as const, label: "Thông tin" },
    ...(permissions
      ? [{ value: "permissions" as const, label: "Phân quyền" }]
      : []),
    { value: "projects" as const, label: "Dự án" },
  ];
  const groups = useListPermissionGroupsQuery(
    { pageSize: 100, status: "ACTIVE" },
    { enabled: mode === "create" },
  );
  const user = query.data;
  const failed = [query, units, groups].find((item) => item.isError);
  const loading =
    !units.data ||
    (mode !== "create" && !user) ||
    (mode === "create" && !groups.data);
  return (
    <EntityDialog
      open
      size="lg"
      title={
        mode === "create"
          ? "Cấp tài khoản nội bộ"
          : mode === "edit"
            ? "Sửa tài khoản"
            : "Chi tiết tài khoản"
      }
      stamp={
        user && (
          <RecordStamp
            createdBy={user.createdBy}
            createdAt={user.createdAt}
            updatedBy={user.updatedBy}
            updatedAt={user.updatedAt}
          />
        )
      }
      onClose={dialog.close}
    >
      {failed?.error ? (
        <QueryErrorState error={failed.error} retry={failed.refetch} />
      ) : loading ? (
        <PageSkeleton variant="form" />
      ) : (
        <>
          {user && (
            <DialogTabs
              label="Mục tài khoản"
              value={tab}
              onChange={setTab}
              items={tabs}
            />
          )}
          {user && tab === "permissions" ? (
            <UserPermissionsPanel userId={user.id} readOnly={mode === "view"} />
          ) : user && tab === "projects" ? (
            <UserProjectsPanel userId={user.id} />
          ) : (
            <>
              <UserProfileForm
                mode={mode}
                user={user}
                units={units.data!.items.map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
                groups={groups.data?.items.map((g) => ({
                  value: g.id,
                  label: g.name,
                }))}
                reload={() => query.refetch()}
                onSaved={(id) => dialog.switchTo("view", id)}
                onCancel={async () => {
                  if (!(await confirmDiscard())) return;
                  if (mode === "edit") dialog.switchTo("view", dialog.id);
                  else dialog.close();
                }}
              />
              {mode === "view" && user && (
                <UserCommands user={user} reload={query.refetch} />
              )}
            </>
          )}
          {mode === "view" && user && (
            <DialogFooter>
              <Button type="button" onClick={dialog.close}>
                Đóng
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => dialog.switchTo("edit", dialog.id)}
              >
                Chỉnh sửa
              </Button>
            </DialogFooter>
          )}
        </>
      )}
    </EntityDialog>
  );
}
