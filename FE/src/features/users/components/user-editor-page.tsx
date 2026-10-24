"use client";
import type { FormField } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import {
  Badge,
  ButtonLink,
  Loading,
  PageHeader,
  Panel,
  PermissionGate,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUnitsQuery } from "@/features/organization/hooks/use-organization-queries";
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  userLockSchema,
} from "@/features/users/schemas/user-form.schema";
import { systemRoleSchema } from "@/features/users/schemas/user.schema";
import { type UserDto } from "@/features/users/types/users.types";
import { changedFields, dateTime, options } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { reasonSchema } from "@/lib/validation/common.schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateUserMutation,
  useLockUserMutation,
  useResetUserPasswordMutation,
  useUnlockUserMutation,
  useUpdateUserMutation,
} from "../hooks/use-users-mutations";
import { useGetUserQuery } from "../hooks/use-users-queries";

const reason: FormField = {
  name: "reason",
  label: "Lý do",
  type: "textarea",
  required: true,
};
export function UserEditorPage({ userId }: { userId?: string }) {
  return (
    <PermissionGate permission="USERS_MANAGE">
      <UserEditorLoader userId={userId} />
    </PermissionGate>
  );
}
function UserEditorLoader({ userId }: { userId?: string }) {
  const query = useGetUserQuery(userId ?? "", { enabled: Boolean(userId) });
  const units = useListUnitsQuery({ pageSize: 100, status: "ACTIVE" });
  if (units.isError)
    return (
      <QueryErrorState error={units.error} retry={() => void units.refetch()} />
    );
  if (!units.data || (userId && query.isPending)) return <Loading />;
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  return (
    <>
      <PageHeader
        title={userId ? "Chi tiết tài khoản" : "Cấp tài khoản nội bộ"}
        description="Vai trò hệ thống và quyền trên dự án được quản lý riêng."
        actions={
          <ButtonLink href="/admin/users">Danh sách tài khoản</ButtonLink>
        }
      />
      <UserProfileForm
        key={userId ?? "new"}
        user={query.data}
        units={units.data.items.map((u) => ({ value: u.id, label: u.name }))}
        reload={() => query.refetch()}
      />
      {query.data && <UserCommands user={query.data} />}
    </>
  );
}
function UserProfileForm({
  user,
  units,
  reload,
}: {
  user?: UserDto;
  units: {
    value: string;
    label: string;
  }[];
  reload: () => Promise<{
    data?: UserDto;
  }>;
}) {
  const router = useRouter();
  const create = useCreateUserMutation();
  const update = useUpdateUserMutation();
  const snapshot = useEditSnapshot(user);
  const fields: FormField[] = [
    ...(!user
      ? [{ name: "username", label: "Tên đăng nhập", required: true }]
      : []),
    { name: "displayName", label: "Họ tên", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    {
      name: "unitId",
      label: "Đơn vị",
      type: "select",
      options: units,
      required: true,
    },
    {
      name: "systemRole",
      label: "Vai trò hệ thống",
      type: "select",
      options: options(systemRoleSchema.options),
      required: true,
    },
    ...(user
      ? [
          {
            ...reason,
            required: false,
            emptyAsUndefined: true,
            hint: "Bắt buộc khi thay đổi vai trò.",
          },
        ]
      : [
          {
            name: "initialPassword",
            label: "Mật khẩu khởi tạo",
            type: "password" as const,
            required: true,
            hint: "Tối thiểu 8 ký tự. Chỉ chuyển cho người nhận qua kênh nội bộ phù hợp.",
          },
        ]),
  ];
  const formProps = {
    fields: fields,
    defaults: user
      ? {
          displayName: user.displayName,
          email: user.email,
          unitId: user.unitId,
          systemRole: user.systemRole,
        }
      : { systemRole: "EMPLOYEE", unitId: units[0]?.value ?? "" },
    onConflictReload: () => snapshot.load(reload),
    onConflictAccept: snapshot.accept,
    cancel: <ButtonLink href="/admin/users">Hủy</ButtonLink>,
    submitLabel: user ? "Lưu thông tin" : "Tạo tài khoản",
  };
  return (
    <Panel title="Thông tin tài khoản">
      {user && (
        <p className="metadata">
          {user.username} · Mã tài khoản: {user.id} ·{" "}
          <Badge value={user.status} /> · Cập nhật {dateTime(user.updatedAt)}
        </p>
      )}
      {user ? (
        <SchemaForm
          {...formProps}
          schema={updateUserSchema}
          onSubmit={async (values) => {
            if (user && snapshot.base) {
              const patch = changedFields(snapshot.base, values, [
                "displayName",
                "email",
                "unitId",
                "systemRole",
              ]);
              await update.mutateAsync({
                userId: user.id,
                payload: updateUserSchema.parse({
                  ...patch,
                  ...(values.reason ? { reason: values.reason } : {}),
                }),
                version: snapshot.base.version,
              });
              toast.success("Đã lưu tài khoản.");
            }
            router.push("/admin/users");
          }}
        />
      ) : (
        <SchemaForm
          {...formProps}
          schema={createUserSchema}
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            toast.success("Đã cấp tài khoản.");

            router.push("/admin/users");
          }}
        />
      )}
    </Panel>
  );
}
function UserCommands({ user }: { user: UserDto }) {
  const [mode, setMode] = useState<"lock" | "password" | null>(null);
  const lock = useLockUserMutation();
  const unlock = useUnlockUserMutation();
  const reset = useResetUserPasswordMutation();
  const isLocked = user.status === "LOCKED";
  const fields: FormField[] =
    mode === "password"
      ? [
          {
            name: "temporaryPassword",
            label: "Mật khẩu tạm",
            type: "password",
            required: true,
          },
          reason,
        ]
      : isLocked
        ? [reason]
        : [
            {
              name: "mode",
              label: "Chế độ khóa",
              type: "select",
              options: [
                {
                  value: "NORMAL",
                  label: "Thông thường — sau khi bàn giao",
                },
                {
                  value: "EMERGENCY",
                  label: "Khẩn cấp — thu hồi phiên ngay",
                },
              ],
              required: true,
            },
            reason,
          ];
  const actionProps = {
    fields,
    defaults: mode === "lock" && !isLocked ? { mode: "NORMAL" } : {},
  };
  const target = { userId: user.id, version: user.version };
  const onSaved = () => {
    toast.success("Đã cập nhật quyền truy cập.");
    setMode(null);
  };
  return (
    <Panel title="Truy cập và mật khẩu">
      <p className="muted">
        Khóa thông thường yêu cầu bàn giao việc mở. Khóa khẩn cấp thu hồi truy
        cập ngay và giữ lịch sử.
      </p>
      <div className="actions section-gap">
        <button
          onClick={() => {
            if (confirmDiscard()) setMode(mode === "lock" ? null : "lock");
          }}
        >
          {isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
        </button>
        <button
          onClick={() => {
            if (confirmDiscard())
              setMode(mode === "password" ? null : "password");
          }}
        >
          Cấp lại mật khẩu
        </button>
      </div>
      {mode &&
        (mode === "password" ? (
          <SchemaForm
            key={`${mode}-${user.status}`}
            {...actionProps}
            schema={resetPasswordSchema}
            onSubmit={async (values) => {
              await reset.mutateAsync({ ...target, payload: values });
              onSaved();
            }}
          />
        ) : isLocked ? (
          <SchemaForm
            key={`${mode}-${user.status}`}
            {...actionProps}
            schema={reasonSchema}
            onSubmit={async (values) => {
              await unlock.mutateAsync({ ...target, payload: values });
              onSaved();
            }}
          />
        ) : (
          <SchemaForm
            key={`${mode}-${user.status}`}
            {...actionProps}
            schema={userLockSchema}
            onSubmit={async (values) => {
              await lock.mutateAsync({ ...target, payload: values });
              onSaved();
            }}
          />
        ))}
    </Panel>
  );
}
