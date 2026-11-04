"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { ButtonLink, PageHeader, Panel } from "@/components/ui/page";
import { ProfileHeader } from "@/components/ui/profile-header";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useSession } from "@/lib/auth/session-context";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useGetProfileQuery } from "../hooks/use-users-queries";

export function MemberProfilePage({ userId }: { userId: string }) {
  const { session } = useSession();
  const query = useGetProfileQuery(userId);
  useCrumbLabel("user", userId, query.data?.displayName);
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
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
      <div className="max-w-3xl">
        <ProfileHeader
          name={user.displayName}
          avatarUrl={user.avatarUrl}
          unit={user.unit}
          role={user.groups.join(", ") || undefined}
        />
        <Panel title="Thông tin liên hệ">
          <dl className="m-0 grid gap-y-2 text-sm [&>div]:grid [&>div]:grid-cols-[9rem_minmax(0,1fr)] [&>div]:items-baseline [&>div]:gap-x-3 [&_dt]:text-fg-subtle [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:text-left [&_dd]:break-words">
            <div>
              <dt>Email</dt>
              <dd>
                <a
                  className="font-medium text-selected-fg underline-offset-2 hover:underline"
                  href={`mailto:${user.email}`}
                >
                  {user.email}
                </a>
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </>
  );
}
