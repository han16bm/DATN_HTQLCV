"use client";
import { ReasonForm } from "@/components/forms/reason-form";
import { DataTable } from "@/components/patterns/data-table";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  EntityDialog,
  RowDialogLinks,
} from "@/components/ui/entity-dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { Lozenge } from "@/components/ui/lozenge";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { RecordStamp, stampText } from "@/components/ui/record-stamp";
import { hasPermission } from "@/lib/auth/access";
import { useSession } from "@/lib/auth/session-context";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { label } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateProjectRolePolicyMutation } from "../hooks/use-permissions-mutations";
import { useListProjectRolePoliciesQuery } from "../hooks/use-permissions-queries";
import { projectPermissionCodes } from "../schemas/project-role-policy.schema";
import type { ProjectRolePolicyDto } from "../types/permissions.types";

const roleText: Record<ProjectRolePolicyDto["role"], string> = {
  OWNER: "Chủ dự án",
  MANAGER: "Quản lý dự án",
  MEMBER: "Thành viên",
};
const roleHint: Record<ProjectRolePolicyDto["role"], string> = {
  OWNER: "Luôn có đủ quyền trong dự án của mình; chỉ chủ dự án bàn giao được dự án.",
  MANAGER: "Chỉ có hiệu lực khi tài khoản có quyền Leader/PM (PROJECT_CREATE).",
  MEMBER: "Áp dụng cho mọi thành viên của dự án, không cần quyền Leader/PM.",
};

// Ma trận quyền theo vai trò dự án (ADMIN_MODULES §11): một người giữ vai trò khác nhau ở từng dự án.
export function ProjectRolesPage() {
  const query = useListProjectRolePoliciesQuery();
  const dialog = useEntityDialog();
  const { session } = useSession();
  const canEdit = hasPermission(session, "PERMISSIONS_MANAGE");
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton variant="table" />;
  const selected = query.data.find((policy) => policy.role === dialog.id);
  return (
    <>
      <PageHeader
        title="Vai trò dự án"
        description="Quyền mỗi vai trò có trong từng dự án. Thay đổi áp dụng ngay cho mọi dự án ở lần thao tác tiếp theo."
      />
      <DataTable
        title="Ma trận quyền"
        actions
        widths={[18, 50, 18, 14]}
        headers={["Vai trò", "Quyền trong dự án", "Cập nhật", "Hành động"]}
        rows={query.data.map((policy) => [
          <span key="role" className="grid gap-0.5">
            <span className="font-medium">{roleText[policy.role]}</span>
            <span className="text-xs text-fg-subtle">{roleHint[policy.role]}</span>
          </span>,
          <span key="perms" className="flex flex-wrap gap-1">
            {policy.permissions.length ? (
              policy.permissions.map((code) => (
                <Lozenge key={code} tone="info">
                  {label(code)}
                </Lozenge>
              ))
            ) : (
              <span className="text-fg-subtle">Chỉ làm việc được giao</span>
            )}
          </span>,
          policy.updatedAt ? stampText(policy.updatedBy, policy.updatedAt) : "Mặc định",
          <span key="actions" className="actions inline-flex items-center gap-1">
            <RowDialogLinks
              name={roleText[policy.role]}
              view={dialog.href("view", policy.role)}
              edit={
                canEdit && policy.editable
                  ? dialog.href("edit", policy.role)
                  : undefined
              }
            />
          </span>,
        ])}
      />
      {dialog.mode && selected && (
        <EntityDialog
          open
          title={roleText[selected.role]}
          stamp={
            selected.updatedAt ? (
              <RecordStamp
                updatedBy={selected.updatedBy}
                updatedAt={selected.updatedAt}
              />
            ) : undefined
          }
          onClose={dialog.close}
        >
          {dialog.mode === "edit" && canEdit && selected.editable ? (
            <PolicyForm
              key={`${selected.role}-${selected.version}`}
              policy={selected}
              reload={async () => {
                const result = await query.refetch();
                return {
                  data: result.data?.find((p) => p.role === selected.role),
                };
              }}
              onCancel={async () => {
                if (await confirmDiscard()) dialog.switchTo("view", selected.role);
              }}
              onDone={() => dialog.switchTo("view", selected.role)}
            />
          ) : (
            <>
              <PermissionChecklist value={selected.permissions} disabled />
              {!selected.editable && (
                <Notice tone="info">{roleHint.OWNER}</Notice>
              )}
              <DialogFooter>
                <Button type="button" onClick={dialog.close}>
                  Đóng
                </Button>
                {canEdit && selected.editable && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => dialog.switchTo("edit", selected.role)}
                  >
                    Sửa quyền
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </EntityDialog>
      )}
    </>
  );
}

function PermissionChecklist({
  value,
  disabled,
  onChange,
}: {
  value: string[];
  disabled?: boolean;
  onChange?: (value: string[]) => void;
}) {
  return (
    <fieldset className="m-0 grid gap-2 border-0 p-0" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium">Quyền trong dự án</legend>
      {projectPermissionCodes.map((code) => (
        <label key={code} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-selected-fg,currentColor)]"
            checked={value.includes(code)}
            onChange={(event) =>
              onChange?.(
                event.target.checked
                  ? projectPermissionCodes.filter(
                      (c) => c === code || value.includes(c),
                    )
                  : value.filter((c) => c !== code),
              )
            }
          />
          <span>{label(code)}</span>
          <span className="text-xs text-fg-subtle">{code}</span>
        </label>
      ))}
    </fieldset>
  );
}

function PolicyForm({
  policy,
  reload,
  onCancel,
  onDone,
}: {
  policy: ProjectRolePolicyDto;
  reload: () => Promise<{ data?: ProjectRolePolicyDto }>;
  onCancel: () => void;
  onDone: () => void;
}) {
  const snapshot = useEditSnapshot(policy);
  const [permissions, setPermissions] = useState<string[]>(policy.permissions);
  const mutation = useUpdateProjectRolePolicyMutation();
  return (
    <>
      <PermissionChecklist value={permissions} onChange={setPermissions} />
      <p className="mt-3 text-xs text-fg-subtle">{roleHint[policy.role]}</p>
      <ReasonForm
        submitLabel="Lưu quyền"
        cancel={
          <Button type="button" onClick={onCancel}>
            Hủy
          </Button>
        }
        compareFields={[{ name: "permissions", label: "Quyền trong dự án" }]}
        onConflictReload={() => snapshot.load(reload)}
        onConflictAccept={snapshot.accept}
        onSubmit={async ({ reason }) => {
          await mutation.mutateAsync({
            role: policy.role,
            payload: {
              permissions: permissions as ProjectRolePolicyDto["permissions"],
              reason,
            },
            version: snapshot.base.version,
          });
          toast.success("Đã cập nhật quyền của vai trò dự án.");
          onDone();
        }}
      />
    </>
  );
}
