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
import { useSession } from "@/lib/auth/session-context";
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
  useRevokeUserSessionsMutation,
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
import { UserHandoverPanel } from "./user-handover-panel";

export function UserCommands({
  user,
  reload,
}: {
  user: UserDto;
  reload: () => Promise<{ data?: UserDto }>;
}) {
  const [mode, setMode] = useState<"lock" | "password" | "sessions" | null>(
    null,
  );
  const self = useSession().session?.user.id === user.id;
  const revoke = useRevokeUserSessionsMutation();
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
      {/* Chính mình thì dùng Đăng xuất; BE cũng chặn (422). */}
      {!self && (
        <Button
          onClick={async () => {
            if (await confirmDiscard())
              setMode(mode === "sessions" ? null : "sessions");
          }}
        >
          Thu hồi phiên đăng nhập
        </Button>
      )}
    </div>
  );
  return (
    <Panel title="Truy cập và mật khẩu" actions={actions}>
      {mode === null && (
        <p className="m-0 text-xs text-fg-subtle">
          Khóa hoặc mở khóa, cấp lại mật khẩu (đăng xuất mọi phiên cũ) hoặc thu
          hồi phiên đăng nhập của tài khoản này.
        </p>
      )}
      {mode === "lock" && !isLocked && (
        <>
          <p className="mt-4 text-xs text-fg-subtle">
            Khóa thông thường yêu cầu bàn giao việc mở. Khóa khẩn cấp thu hồi
            truy cập ngay.
          </p>
          <UserHandoverPanel user={user} />
        </>
      )}
      {mode === "sessions" && (
        <>
          <p className="mt-4 text-xs text-fg-subtle">
            Đăng xuất tài khoản khỏi mọi thiết bị ngay (máy mất, nghi lộ mật
            khẩu); tài khoản vẫn hoạt động và đăng nhập lại được.
          </p>
          <ReasonForm
            submitLabel="Thu hồi phiên"
            onSubmit={async (payload) => {
              await revoke.mutateAsync({ userId: user.id, payload });
              toast.success("Đã thu hồi mọi phiên đăng nhập.");
              setMode(null);
            }}
          />
        </>
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
