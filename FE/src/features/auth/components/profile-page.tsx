"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink, PageHeader, Panel } from "@/components/ui/page";
import { useSession } from "@/lib/auth/session-context";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateProfileMutation } from "../hooks/use-auth-mutations";
import type { SessionDto } from "../types/auth.types";
import { AvatarEditor } from "./avatar-editor";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileInfo } from "./profile-info";

export function ProfilePage() {
  const { session } = useSession();
  return session ? <ProfileDetails user={session.user} /> : null;
}

function ProfileDetails({ user }: { user: SessionDto["user"] }) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { refresh } = useSession();
  const update = useUpdateProfileMutation();
  const snapshot = useEditSnapshot(user);
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
      <ProfileInfo
        user={user}
        actions={
          <div className="grid gap-3">
            <div className="flex flex-wrap items-start gap-2">
              <AvatarEditor
                onSelect={() => snapshot.saved(user)}
                onSave={async (file) => {
                  const result = await update.mutateAsync({
                    payload: { avatar: file },
                    version: snapshot.base.version,
                  });
                  snapshot.saved(result.user);
                  toast.success("Đã cập nhật ảnh đại diện.");
                }}
                onConflictReload={() =>
                  snapshot.load(async () => {
                    const result = await refresh();
                    return { data: result.data?.user };
                  })
                }
                onConflictAccept={snapshot.accept}
              />
              {!passwordOpen && (
                <Button onClick={() => setPasswordOpen(true)}>
                  Đổi mật khẩu
                </Button>
              )}
            </div>
            {passwordOpen && (
              <Panel title="Mật khẩu" compact>
                <ChangePasswordForm
                  onSaved={() => setPasswordOpen(false)}
                  onCancel={() => setPasswordOpen(false)}
                />
              </Panel>
            )}
          </div>
        }
      />
    </>
  );
}
