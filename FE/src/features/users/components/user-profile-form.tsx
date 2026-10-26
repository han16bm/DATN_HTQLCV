"use client";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { Avatar } from "@/components/ui/avatar";
import { Badge, ButtonLink, Panel } from "@/components/ui/page";
import { changedFields, dateTime, label, options } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../hooks/use-users-mutations";
import {
  createUserSchema,
  updateUserSchema,
} from "../schemas/user-form.schema";
import { systemRoleSchema } from "../schemas/user.schema";
import { type UserDto } from "../types/users.types";
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

  const [open, setOpen] = useState(false);
  const cancel = async () => {
    if (!(await confirmDiscard("Bỏ thay đổi tài khoản chưa lưu?"))) return;
    form.reset(defaults);
    setOpen(false);
  };
  const schema = user
    ? updateUserSchema
        .required({
          displayName: true,
          email: true,
          unitId: true,
          systemRole: true,
        })
        .extend({ reason: z.string().trim().max(2000).optional() })
    : createUserSchema;
  type Values = z.input<typeof schema>;
  const defaults: Values = user
    ? {
        displayName: user.displayName,
        email: user.email,
        unitId: user.unitId,
        systemRole: user.systemRole,
        reason: "",
      }
    : {
        username: "",
        displayName: "",
        email: "",
        unitId: units[0]?.value ?? "",
        systemRole: "EMPLOYEE",
        initialPassword: "",
      };
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues: defaults,
  });
  const { errors } = form.formState;
  return (
    <Panel
      title="Thông tin tài khoản"
      actions={
        user && !open ? (
          <button
            type="button"
            onClick={() => {
              snapshot.saved(user);
              form.reset(defaults);
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
      ) : (
        <Form
          form={form}
          submitLabel={user ? "Lưu thông tin" : "Tạo tài khoản"}
          cancel={
            user ? (
              <button type="button" onClick={cancel}>
                Hủy
              </button>
            ) : (
              <ButtonLink href="/admin/users">Hủy</ButtonLink>
            )
          }
          compareFields={[
            { name: "displayName", label: "Họ tên" },
            { name: "email", label: "Email" },
            { name: "unitId", label: "Đơn vị", options: units },
            {
              name: "systemRole",
              label: "Vai trò hệ thống",
              options: options(systemRoleSchema.options),
            },
          ]}
          onConflictReload={() => snapshot.load(reload)}
          onConflictAccept={snapshot.accept}
          onSubmit={async (values) => {
            if ("username" in values) {
              await create.mutateAsync(values);
              toast.success("Đã cấp tài khoản.");
            } else {
              const base = snapshot.base!;
              await update.mutateAsync({
                userId: base.id,
                payload: {
                  ...changedFields(base, values, [
                    "displayName",
                    "email",
                    "unitId",
                    "systemRole",
                  ]),
                  ...(values.reason ? { reason: values.reason } : {}),
                },
                version: base.version,
              });
              toast.success("Đã lưu tài khoản.");
            }
            router.push("/admin/users");
          }}
        >
          {!user && (
            <FormInput
              label="Tên đăng nhập"
              required
              width="short"
              {...form.register("username")}
              error={form.getFieldState("username", form.formState).error}
            />
          )}
          <FormInput
            label="Họ tên"
            required
            width={user ? "medium" : "long"}
            {...form.register("displayName")}
            error={errors.displayName}
          />
          <FormInput
            label="Email"
            type="email"
            required
            {...form.register("email")}
            error={errors.email}
          />
          <FormSelect
            label="Đơn vị"
            required
            options={units}
            {...form.register("unitId")}
            error={errors.unitId}
          />
          <FormSelect
            label="Vai trò hệ thống"
            required
            options={options(systemRoleSchema.options)}
            {...form.register("systemRole")}
            error={errors.systemRole}
          />
          {user ? (
            <FormTextarea
              label="Lý do"
              hint="Bắt buộc khi thay đổi vai trò."
              {...form.register("reason")}
              error={form.getFieldState("reason", form.formState).error}
            />
          ) : (
            <FormInput
              label="Mật khẩu khởi tạo"
              type="password"
              autoComplete="new-password"
              required
              hint="Tối thiểu 8 ký tự. Chỉ chuyển cho người nhận qua kênh nội bộ phù hợp."
              {...form.register("initialPassword")}
              error={
                form.getFieldState("initialPassword", form.formState).error
              }
            />
          )}
        </Form>
      )}
    </Panel>
  );
}
