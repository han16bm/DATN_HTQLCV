"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { toast } from "sonner";
import { useChangePasswordMutation } from "../hooks/use-auth-mutations";
import { passwordFormSchema } from "../schemas/password.schema";

export function ChangePasswordForm({ onSaved }: { onSaved: () => void }) {
  const change = useChangePasswordMutation();
  return (
    <SchemaForm
      schema={passwordFormSchema}
      fields={[
        {
          name: "currentPassword",
          label: "Mật khẩu hiện tại",
          type: "password",
          autoComplete: "current-password",
          required: true,
          width: "full",
        },
        {
          name: "newPassword",
          label: "Mật khẩu mới",
          type: "password",
          width: "full",
          required: true,
          hint: "Tối thiểu 8 ký tự.",
        },
        {
          name: "confirmPassword",
          label: "Nhập lại mật khẩu mới",
          type: "password",
          width: "full",
          required: true,
        },
      ]}
      defaults={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
      submitLabel="Cập nhật mật khẩu"
      onSubmit={async ({ currentPassword, newPassword }) => {
        await change.mutateAsync({ currentPassword, newPassword });
        onSaved();
        toast.success("Đã đổi mật khẩu.");
      }}
    />
  );
}
