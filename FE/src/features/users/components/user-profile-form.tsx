"use client";
import type { FormField, FormOption } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { Badge, ButtonLink, Panel } from "@/components/ui/page";
import { Avatar } from "@/components/ui/avatar";
import {
  createUserSchema,
  updateUserSchema,
} from "@/features/users/schemas/user-form.schema";
import { systemRoleSchema } from "@/features/users/schemas/user.schema";
import { type UserDto } from "@/features/users/types/users.types";
import { changedFields, dateTime, label, options } from "@/lib/format";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../hooks/use-users-mutations";
export function UserProfileForm({
  user,
  units,
  reload,
}: {
  user?: UserDto;
  units: FormOption[];
  reload: () => Promise<{
    data?: UserDto;
  }>;
}) {
  const router = useRouter();
  const create = useCreateUserMutation();
  const update = useUpdateUserMutation();
  const snapshot = useEditSnapshot(user);
  const base = snapshot.base;
  const [open, setOpen] = useState(false);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ thay đổi tài khoản chưa lưu?"))) return;
    setOpen(false);
  };
  const fields: FormField[] = [
    ...(!user
      ? [
          {
            name: "username",
            label: "Tên đăng nhập",
            required: true,
            width: "short" as const,
          },
        ]
      : []),
    {
      name: "displayName",
      label: "Họ tên",
      required: true,
      width: user ? "medium" : "long",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      width: "medium",
    },
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
            name: "reason",
            label: "Lý do",
            type: "textarea" as const,
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
    fields,
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
    cancel: user ? (
      <button type="button" onClick={cancel}>
        Hủy
      </button>
    ) : (
      <ButtonLink href="/admin/users">Hủy</ButtonLink>
    ),
    submitLabel: user ? "Lưu thông tin" : "Tạo tài khoản",
  };
  return (
    <Panel
      title="Thông tin tài khoản"
      actions={
        user && !open ? (
          <button
            type="button"
            onClick={() => {
              snapshot.saved(user);
              setOpen(true);
            }}
          >
            Chỉnh sửa thông tin
          </button>
        ) : undefined
      }
    >
      {user && (
        <div className="account-identity">
          <Avatar name={user.displayName} src={user.avatarUrl} large />
          <div>
            <strong>{user.displayName}</strong>
            <span className="small muted">{user.username}</span>
          </div>
          <Badge value={user.status} />
        </div>
      )}
      {user && !open ? (
        <>
          <dl className="record-details">
            <div>
              <dt>Đơn vị</dt>
              <dd>{user.unit.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Vai trò hệ thống</dt>
              <dd>{label(user.systemRole)}</dd>
            </div>
            <div>
              <dt>Cập nhật lần cuối</dt>
              <dd>{dateTime(user.updatedAt)}</dd>
            </div>
          </dl>
        </>
      ) : base ? (
        <SchemaForm
          {...formProps}
          schema={updateUserSchema}
          onSubmit={async (values) => {
            const patch = changedFields(base, values, [
              "displayName",
              "email",
              "unitId",
              "systemRole",
            ]);
            await update.mutateAsync({
              userId: base.id,
              payload: updateUserSchema.parse({
                ...patch,
                ...(values.reason ? { reason: values.reason } : {}),
              }),
              version: base.version,
            });
            toast.success("Đã lưu tài khoản.");
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
