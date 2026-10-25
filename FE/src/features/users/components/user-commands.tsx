"use client";
import type { FormField } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { Panel } from "@/components/ui/page";
import {
  resetPasswordSchema,
  userLockSchema,
} from "@/features/users/schemas/user-form.schema";
import { type UserDto } from "@/features/users/types/users.types";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { reasonSchema } from "@/lib/validation/common.schema";
import { useState } from "react";
import { toast } from "sonner";
import {
  useLockUserMutation,
  useResetUserPasswordMutation,
  useUnlockUserMutation,
} from "../hooks/use-users-mutations";
const reason: FormField = {
  name: "reason",
  label: "Lý do",
  type: "textarea",
  required: true,
};
export function UserCommands({ user }: { user: UserDto }) {
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
    <Panel title="Truy cập và mật khẩu" className="account-access">
      <div className="actions">
        <button
          onClick={async () => {
            if (await confirmDiscard())
              setMode(mode === "lock" ? null : "lock");
          }}
        >
          {isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
        </button>
        <button
          onClick={async () => {
            if (await confirmDiscard())
              setMode(mode === "password" ? null : "password");
          }}
        >
          Cấp lại mật khẩu
        </button>
      </div>
      {mode === "lock" && !isLocked && (
        <p className="small muted section-gap">
          Khóa thông thường yêu cầu bàn giao việc mở. Khóa khẩn cấp thu hồi truy
          cập ngay.
        </p>
      )}
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
