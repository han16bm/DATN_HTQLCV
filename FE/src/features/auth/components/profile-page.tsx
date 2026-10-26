"use client";

import { Form } from "@/components/forms/form";
import { FormInput } from "@/components/forms/form-field";
import { ButtonLink, PageHeader } from "@/components/ui/page";
import { useSession } from "@/lib/auth/session-context";
import { label } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image as ImageIcon, KeyRound, Mail, UserRound } from "lucide-react";
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
        description={
          <span className="profile-email">
            <Mail size={15} aria-hidden="true" />
            {user.email}
          </span>
        }
        actions={
          <ButtonLink href={`/users/${encodeURIComponent(user.id)}`}>
            Xem hồ sơ công khai
          </ButtonLink>
        }
      />
      <section className="profile-settings">
        <div className="profile-settings-toolbar">
          <div
            className="profile-tabs"
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
                key={value}
                id={`${id}-${value}`}
                type="button"
                role="tab"
                aria-selected={section === value}
                aria-controls={`${id}-content`}
                tabIndex={section === value ? 0 : -1}
                onClick={() => void changeSection(value)}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div
          id={`${id}-content`}
          className="profile-content"
          role="tabpanel"
          aria-labelledby={`${id}-${section}`}
          tabIndex={0}
        >
          {section === "info" ? (
            <div className="profile-info">
              <div className="form-field">
                <label htmlFor={`${id}-email`}>Email</label>
                <input
                  id={`${id}-email`}
                  type="email"
                  value={user.email}
                  readOnly
                  autoComplete="email"
                />
              </div>
              <ProfileInfoForm
                user={snapshot.base}
                onSubmit={onSubmit}
                {...conflict}
              />
              <p className="small muted">
                {user.unit.name} · {label(user.systemRole)}
              </p>
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
        width="full"
        {...form.register("displayName")}
        error={errors.displayName}
      />
      <FormInput
        label="Tên đăng nhập"
        required
        width="full"
        {...form.register("username")}
        error={errors.username}
      />
    </Form>
  );
}
