"use client";

import { Form } from "@/components/forms/form";
import { FormInput } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useChangePasswordMutation } from "../hooks/use-auth-mutations";
import { passwordFormSchema } from "../schemas/password.schema";

export function ChangePasswordForm({ onSaved, onCancel }: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const change = useChangePasswordMutation();
  const form = useForm<z.input<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema, { error: validationMessage }),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const { errors } = form.formState;
  return (
    <Form
      compact
      actions="start"
      form={form}
      submitLabel="Cập nhật mật khẩu"
      cancel={
        <Button
          onClick={async () => {
            if (!form.formState.isDirty || await confirmDiscard("Bỏ thay đổi mật khẩu chưa lưu?"))
              onCancel();
          }}
        >
          Hủy
        </Button>
      }
      onSubmit={async ({ currentPassword, newPassword }) => {
        await change.mutateAsync({ currentPassword, newPassword });
        onSaved();
        toast.success("Đã đổi mật khẩu.");
      }}
    >
      <FormInput
        label="Mật khẩu hiện tại"
        type="password"
        autoComplete="current-password"
        required
        width="full"
        {...form.register("currentPassword")}
        error={errors.currentPassword}
      />
      <FormInput
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        required
        width="full"
        hint="Tối thiểu 8 ký tự."
        {...form.register("newPassword")}
        error={errors.newPassword}
      />
      <FormInput
        label="Nhập lại mật khẩu mới"
        type="password"
        autoComplete="new-password"
        required
        width="full"
        {...form.register("confirmPassword")}
        error={errors.confirmPassword}
      />
    </Form>
  );
}
