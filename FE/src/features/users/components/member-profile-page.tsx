"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { ButtonLink, PageHeader, Panel } from "@/components/ui/page";
import { ProfileHeader } from "@/components/ui/profile-header";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useSession } from "@/lib/auth/session-context";
import { label } from "@/lib/format";
import { useGetProfileQuery } from "../hooks/use-users-queries";

export function MemberProfilePage({ userId }: { userId: string }) {
  const { session } = useSession();
  const query = useGetProfileQuery(userId);
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (!query.data) return <PageSkeleton />;
  const user = query.data;
  return (
    <>
      <PageHeader
        title="Hồ sơ thành viên"
        actions={
          user.id === session?.user.id && (
            <ButtonLink href="/profile">Quản lý hồ sơ</ButtonLink>
          )
        }
      />
      <ProfileHeader
        name={user.displayName}
        avatarUrl={user.avatarUrl}
        unit={user.unit}
        role={label(user.systemRole)}
      />
      <Panel title="Thông tin liên hệ">
        <dl className="record-details">
          <div>
            <dt>Email</dt>
            <dd>
              <a className="text-link" href={`mailto:${user.email}`}>
                {user.email}
              </a>
            </dd>
          </div>
        </dl>
      </Panel>
    </>
  );
}
