"use client";

import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/loading";
import { Panel } from "@/components/ui/page";
import { ProfileHeader } from "@/components/ui/profile-header";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserPersonalInfo } from "@/features/users/components/user-personal-info";
import { UserWorkInfo } from "@/features/users/components/user-work-info";
import { useState, type ReactNode } from "react";
import { accessText } from "@/lib/format";
import type { SessionDto } from "../types/auth.types";
import { useProfileQuery } from "../hooks/use-profile-query";
import { ProfileInfoForm } from "./profile-info-form";

export function ProfileInfo({ user, actions }: {
  user: SessionDto["user"];
  actions: ReactNode;
}) {
  const query = useProfileQuery();
  const [editing, setEditing] = useState(false);
  const profile = query.data;
  return (
    <div className="grid min-w-0 items-start gap-5 @min-[1000px]/page:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-label="Thông tin cá nhân" className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface">
        <ProfileHeader
          embedded
          name={user.displayName}
          avatarUrl={user.avatarUrl}
          unit={user.unit.name}
          role={accessText(user)}
          actions={!editing && profile && !query.isError && <Button onClick={() => setEditing(true)}>Chỉnh sửa</Button>}
        />
        <div className="border-t border-line p-4 md:p-5">
          {query.isError ? (
            <QueryErrorState error={query.error} retry={query.refetch} />
          ) : !profile ? (
            <PageSkeleton />
          ) : editing ? (
            <ProfileInfoForm
              profile={profile}
              reload={query.refetch}
              onDone={() => setEditing(false)}
            />
          ) : (
            <UserPersonalInfo user={profile} />
          )}
        </div>
      </section>
      <aside aria-label="Tùy chọn tài khoản" className="grid min-w-0 gap-5">
        {actions}
        {profile && (
          <Panel title="Thông tin công việc" compact>
            <UserWorkInfo
              unit={profile.unit}
              position={accessText(profile)}
              teams={profile.teams}
              projects={profile.projects}
            />
          </Panel>
        )}
      </aside>
    </div>
  );
}
