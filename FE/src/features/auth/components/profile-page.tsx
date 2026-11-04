"use client";

import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { ProfileHeader } from "@/components/ui/profile-header";
import { FormInput } from "@/components/forms/form-field";
import { ButtonLink, PageHeader } from "@/components/ui/page";
import { useSession } from "@/lib/auth/session-context";
import { label } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image as ImageIcon, KeyRound, UserRound } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useUpdateProfileMutation } from "../hooks/use-auth-mutations";
import { profileInfoSchema } from "../schemas/profile.schema";
import type { SessionDto, UpdateProfileInput } from "../types/auth.types";
import { AvatarEditor } from "./avatar-editor";
import { ChangePasswordForm } from "./change-password-form";

const sections = [
  { value: "info", label: "Thông tin cá nhân", icon: UserRound },
  { value: "avatar", label: "Ảnh đại diện", icon: ImageIcon },
  { value: "password", label: "Đổi mật khẩu", icon: KeyRound },
] as const;
type Section = (typeof sections)[number]["value"];

export function ProfilePage() {
  const { session } = useSession();
  return session ? <ProfileDetails user={session.user} /> : null;
}

function ProfileDetails({ user }: { user: SessionDto["user"] }) {
  const id = useId();
  const { refresh } = useSession();
  const update = useUpdateProfileMutation();
  const [section, setSection] = useState<Section>("info");
  const snapshot = useEditSnapshot(user);
  const changeSection = async (value: Section) => {
    if (
      value === section ||
      !(await confirmDiscard("Bỏ thay đổi hồ sơ chưa lưu?"))
    )
      return;
    snapshot.saved(user);
    setSection(value);
  };
  const onSubmit = async (payload: UpdateProfileInput) => {
    const result = await update.mutateAsync({
      payload,
      version: snapshot.base.version,
    });
    snapshot.saved(result.user);
    toast.success(
      payload.avatar
        ? "Đã cập nhật ảnh đại diện."
        : "Đã cập nhật hồ sơ cá nhân.",
    );
  };
  const conflict = {
    onConflictReload: () =>
      snapshot.load(async () => {
        const result = await refresh();
        return { data: result.data?.user };
      }),
    onConflictAccept: snapshot.accept,
  };
  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        actions={
          <ButtonLink href={`/users/${encodeURIComponent(user.id)}`}>
            Xem hồ sơ công khai
          </ButtonLink>
        }
      />
      <section className="max-w-3xl">
        <ProfileHeader
          name={user.displayName}
          avatarUrl={user.avatarUrl}
          unit={user.unit.name}
          role={label(user.systemRole)}
        />
        <div className="mb-4 rounded-lg bg-sunken p-1">
          <div
            className="flex gap-1 overflow-x-auto"
            role="tablist"
            aria-label="Mục hồ sơ"
            onKeyDown={(event) => {
              const tabs = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  '[role="tab"]',
                ),
              );
              const index = tabs.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              tabs[next].focus();
            }}
          >
            {sections.map(({ value, label, icon: Icon }) => (
              <button
                data-ui
                key={value}
                id={`${id}-${value}`}
                type="button"
                role="tab"
                className="inline-flex min-h-9 flex-1 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm text-fg-subtle transition-colors hover:bg-hover aria-selected:bg-surface aria-selected:font-medium aria-selected:text-selected-fg pointer-coarse:min-h-11"
                aria-selected={section === value}
                aria-controls={`${id}-content`}
                tabIndex={section === value ? 0 : -1}
                onClick={() => void changeSection(value)}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div
          id={`${id}-content`}
          className="rounded-lg border border-line bg-surface p-5"
          role="tabpanel"
          aria-labelledby={`${id}-${section}`}
          tabIndex={0}
        >
          {section === "info" ? (
            <div className="grid gap-4">
              <Field label="Email" width="full">
                {(a11y) => (
                  <Input
                    size="form"
                    {...a11y}
                    type="email"
                    value={user.email}
                    readOnly
                    autoComplete="email"
                  />
                )}
              </Field>
              <ProfileInfoForm
                user={snapshot.base}
                onSubmit={onSubmit}
                {...conflict}
              />
            </div>
          ) : section === "avatar" ? (
            <AvatarEditor
              user={user}
              onSave={(file) => onSubmit({ avatar: file })}
              {...conflict}
            />
          ) : (
            <ChangePasswordForm onSaved={() => setSection("info")} />
          )}
        </div>
      </section>
    </>
  );
}

function ProfileInfoForm({
  user,
  onSubmit,
  ...conflict
}: {
  user: SessionDto["user"];
  onSubmit: (values: z.output<typeof profileInfoSchema>) => Promise<void>;
  onConflictReload: () => Promise<SessionDto["user"]>;
  onConflictAccept: () => void;
}) {
  const form = useForm<z.input<typeof profileInfoSchema>>({
    resolver: zodResolver(profileInfoSchema, { error: validationMessage }),
    defaultValues: { displayName: user.displayName, username: user.username },
  });
  const { errors } = form.formState;
  return (
    <Form
      compact
      actions="start"
      form={form}
      onSubmit={onSubmit}
      submitLabel="Lưu hồ sơ"
      {...conflict}
      compareFields={[
        { name: "displayName", label: "Họ tên" },
        { name: "username", label: "Tên đăng nhập" },
      ]}
    >
      <FormInput
        label="Họ tên"
        required
        width="medium"
        {...form.register("displayName")}
        error={errors.displayName}
      />
      <FormInput
        label="Tên đăng nhập"
        required
        width="medium"
        {...form.register("username")}
        error={errors.username}
      />
    </Form>
  );
}
