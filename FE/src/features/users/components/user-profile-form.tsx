"use client";
import { Button } from "@/components/ui/button";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormMultiSelect,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { Avatar } from "@/components/ui/avatar";
import { StatusField } from "@/components/ui/page";
import { accessText, changedFields } from "@/lib/format";
import type { DialogMode } from "@/lib/forms/use-entity-dialog";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../hooks/use-users-mutations";
import { genders } from "../schemas/personal-info.schema";
import {
  createUserSchema,
  updateUserSchema,
} from "../schemas/user-form.schema";
import { type UserDto } from "../types/users.types";

// Một form cho Thêm/Xem/Sửa tài khoản; chế độ Xem disable mọi trường.
export function UserProfileForm({
  mode,
  user,
  units,
  groups,
  reload,
  onSaved,
  onCancel,
}: {
  mode: DialogMode;
  user?: UserDto;
  units: FormOption[];
  // Nhóm quyền chọn khi cấp tài khoản; không truyền khi thiếu quyền xem nhóm.
  groups?: FormOption[];
  reload: () => Promise<{ data?: UserDto }>;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const create = useCreateUserMutation();
  const update = useUpdateUserMutation();
  const snapshot = useEditSnapshot(user);
  const schema = user
    ? updateUserSchema
        .required({ displayName: true, email: true, unitId: true })
        .extend({ reason: z.string().trim().max(2000).optional() })
    : createUserSchema;
  type Values = z.input<typeof schema>;
  type Output = z.output<typeof schema>;
  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema, {
      error: validationMessage,
    }),
    defaultValues: user
      ? {
          displayName: user.displayName,
          email: user.email,
          unitId: user.unitId,
          gender: user.gender ?? "",
          birthDate: user.birthDate ?? "",
          phone: user.phone ?? "",
          permanentAddress: user.permanentAddress ?? "",
          temporaryAddress: user.temporaryAddress ?? "",
          reason: "",
        }
      : {
          username: "",
          displayName: "",
          email: "",
          unitId: units[0]?.value ?? "",
          groupIds: [],
          initialPassword: "",
        },
  });
  const { errors } = form.formState;
  return (
    <>
      {user && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Avatar name={user.displayName} src={user.avatarUrl} size="lg" />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <strong className="font-semibold text-fg">
              {user.displayName}
            </strong>
            <span className="text-xs text-fg-subtle">{user.username}</span>
            <span className="text-xs text-fg-subtle">{accessText(user)}</span>
          </div>
          <StatusField value={user.status} />
        </div>
      )}
      <Form
        form={form}
        readOnly={mode === "view"}
        submitLabel={user ? "Lưu thông tin" : "Tạo tài khoản"}
        cancel={
          <Button type="button" onClick={onCancel}>
            Hủy
          </Button>
        }
        compareFields={[
          { name: "displayName", label: "Họ tên" },
          { name: "email", label: "Email" },
          { name: "gender", label: "Giới tính", options: genders },
          { name: "birthDate", label: "Ngày sinh" },
          { name: "phone", label: "Số điện thoại" },
          { name: "permanentAddress", label: "Địa chỉ thường trú" },
          { name: "temporaryAddress", label: "Địa chỉ tạm trú" },
          { name: "unitId", label: "Đơn vị", options: units },
        ]}
        onConflictReload={() => snapshot.load(reload)}
        onConflictAccept={snapshot.accept}
        onSubmit={async (values) => {
          if ("username" in values) {
            const created = await create.mutateAsync(values);
            toast.success("Đã cấp tài khoản.");
            onSaved(created.id);
          } else {
            const base = snapshot.base!;
            await update.mutateAsync({
              userId: base.id,
              payload: {
                ...changedFields(base, values, [
                  "displayName",
                  "email",
                  "unitId",
                  "gender",
                  "birthDate",
                  "phone",
                  "permanentAddress",
                  "temporaryAddress",
                ]),
                ...(values.reason ? { reason: values.reason } : {}),
              },
              version: base.version,
            });
            toast.success("Đã lưu tài khoản.");
            onSaved(base.id);
          }
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
          label="Giới tính"
          options={[{ value: "", label: "Chưa cập nhật" }, ...genders]}
          width="short"
          {...form.register("gender")}
          error={form.getFieldState("gender", form.formState).error}
        />
        <FormInput
          label="Ngày sinh"
          type="date"
          width="short"
          {...form.register("birthDate")}
          error={form.getFieldState("birthDate", form.formState).error}
        />
        <FormInput
          label="Số điện thoại"
          type="tel"
          width="short"
          {...form.register("phone")}
          error={form.getFieldState("phone", form.formState).error}
        />
        <FormTextarea
          label="Địa chỉ thường trú"
          {...form.register("permanentAddress")}
          error={form.getFieldState("permanentAddress", form.formState).error}
        />
        <FormTextarea
          label="Địa chỉ tạm trú"
          {...form.register("temporaryAddress")}
          error={form.getFieldState("temporaryAddress", form.formState).error}
        />
        <FormSelect
          label="Đơn vị"
          required
          options={units}
          {...form.register("unitId")}
          error={errors.unitId}
        />
        {!user && groups && (
          <Controller
            name="groupIds"
            control={form.control}
            render={({ field }) => (
              <FormMultiSelect
                label="Nhóm quyền"
                options={groups}
                {...field}
                value={field.value ?? []}
                error={form.getFieldState("groupIds", form.formState).error}
              />
            )}
          />
        )}
        {user ? (
          mode === "edit" && (
            <FormTextarea
              label="Lý do"
              {...form.register("reason")}
              error={form.getFieldState("reason", form.formState).error}
            />
          )
        ) : (
          <FormInput
            label="Mật khẩu khởi tạo"
            type="password"
            autoComplete="new-password"
            required
            hint="Tối thiểu 8 ký tự. Chỉ chuyển cho người nhận qua kênh nội bộ phù hợp."
            {...form.register("initialPassword")}
            error={form.getFieldState("initialPassword", form.formState).error}
          />
        )}
      </Form>
    </>
  );
}
