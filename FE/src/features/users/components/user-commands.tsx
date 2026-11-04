"use client";
import { Button } from "@/components/ui/button";

import { Form, type FormProps } from "@/components/forms/form";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import { ReasonForm } from "@/components/forms/reason-form";
import { Panel } from "@/components/ui/page";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  useLockUserMutation,
  useResetUserPasswordMutation,
  useUnlockUserMutation,
} from "../hooks/use-users-mutations";
import {
  resetPasswordSchema,
  userLockSchema,
} from "../schemas/user-form.schema";
import type {
  LockUserInput,
  ResetUserPasswordInput,
  UserDto,
} from "../types/users.types";

export function UserCommands({
  user,
  reload,
}: {
  user: UserDto;
  reload: () => Promise<{ data?: UserDto }>;
}) {
  const [mode, setMode] = useState<"lock" | "password" | null>(null);
  const lock = useLockUserMutation();
  const unlock = useUnlockUserMutation();
  const reset = useResetUserPasswordMutation();
  const snapshot = useEditSnapshot(user);
  const isLocked = (mode === "lock" ? snapshot.base : user).status === "LOCKED";
  const target = { userId: user.id, version: snapshot.base.version };
  const conflict = {
    onConflictReload: () => snapshot.load(reload),
    onConflictAccept: snapshot.accept,
    compareFields: [
      { name: "displayName", label: "Họ tên" },
      { name: "status", label: "Trạng thái" },
    ],
  };
  const onSaved = () => {
    toast.success("Đã cập nhật quyền truy cập.");
    setMode(null);
  };
  const actions = (
    <div className="actions flex flex-wrap items-center gap-2">
      <Button
        onClick={async () => {
          if (await confirmDiscard()) {
            snapshot.saved(user);
            setMode(mode === "lock" ? null : "lock");
          }
        }}
      >
        {isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
      </Button>
      <Button
        onClick={async () => {
          if (await confirmDiscard()) {
            snapshot.saved(user);
            setMode(mode === "password" ? null : "password");
          }
        }}
      >
        Cấp lại mật khẩu
      </Button>
    </div>
  );
  return (
    <Panel title="Truy cập và mật khẩu" actions={actions}>
      {mode === "lock" && !isLocked && (
        <p className="mt-4 text-xs text-fg-subtle">
          Khóa thông thường yêu cầu bàn giao việc mở. Khóa khẩn cấp thu hồi truy
          cập ngay.
        </p>
      )}
      {mode === "password" ? (
        <PasswordResetForm
          {...conflict}
          onSubmit={async (payload) => {
            await reset.mutateAsync({ ...target, payload });
            onSaved();
          }}
        />
      ) : (
        mode === "lock" &&
        (isLocked ? (
          <ReasonForm
            {...conflict}
            onSubmit={async (payload) => {
              await unlock.mutateAsync({ ...target, payload });
              onSaved();
            }}
          />
        ) : (
          <LockForm
            {...conflict}
            onSubmit={async (payload) => {
              await lock.mutateAsync({ ...target, payload });
              onSaved();
            }}
          />
        ))
      )}
    </Panel>
  );
}

function PasswordResetForm({
  onSubmit,
  ...conflict
}: Pick<
  FormProps<ResetUserPasswordInput>,
  "onSubmit" | "onConflictReload" | "onConflictAccept" | "compareFields"
>) {
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema, { error: validationMessage }),
    defaultValues: { temporaryPassword: "", reason: "" },
  });
  return (
    <Form compact form={form} onSubmit={onSubmit} {...conflict}>
      <FormInput
        label="Mật khẩu tạm"
        type="password"
        autoComplete="new-password"
        required
        {...form.register("temporaryPassword")}
        error={form.formState.errors.temporaryPassword}
      />
      <FormTextarea
        label="Lý do"
        required
        {...form.register("reason")}
        error={form.formState.errors.reason}
      />
    </Form>
  );
}

function LockForm({
  onSubmit,
  ...conflict
}: Pick<
  FormProps<LockUserInput>,
  "onSubmit" | "onConflictReload" | "onConflictAccept" | "compareFields"
>) {
  const form = useForm<LockUserInput>({
    resolver: zodResolver(userLockSchema, { error: validationMessage }),
    defaultValues: { mode: "NORMAL", reason: "" },
  });
  return (
    <Form compact form={form} onSubmit={onSubmit} {...conflict}>
      <FormSelect
        label="Chế độ khóa"
        required
        options={[
          { value: "NORMAL", label: "Thông thường — sau khi bàn giao" },
          { value: "EMERGENCY", label: "Khẩn cấp — thu hồi phiên ngay" },
        ]}
        {...form.register("mode")}
        error={form.formState.errors.mode}
      />
      <FormTextarea
        label="Lý do"
        required
        {...form.register("reason")}
        error={form.formState.errors.reason}
      />
    </Form>
  );
}
