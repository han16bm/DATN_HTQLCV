"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUnitsQuery } from "@/features/organization/hooks/use-organization-queries";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useGetUserQuery } from "../hooks/use-users-queries";
import { UserCommands } from "./user-commands";
import { UserProfileForm } from "./user-profile-form";

export function UserEditorPage({ userId }: { userId?: string }) {
  const query = useGetUserQuery(userId ?? "");
  const units = useListUnitsQuery({ pageSize: 100, status: "ACTIVE" });
  useCrumbLabel("user", userId ?? "", query.data?.displayName);
  if (units.isError)
    return <QueryErrorState error={units.error} retry={units.refetch} />;
  if (!units.data || (userId && query.isPending))
    return <PageSkeleton variant="form" />;
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  return (
    <>
      <PageHeader
        title={userId ? "Chi tiết tài khoản" : "Cấp tài khoản nội bộ"}
      />
      <div className={query.data ? "account-layout" : undefined}>
        <UserProfileForm
          key={userId ?? "new"}
          user={query.data}
          units={units.data.items.map((u) => ({ value: u.id, label: u.name }))}
          reload={() => query.refetch()}
        />
        {query.data && (
          <UserCommands user={query.data} reload={query.refetch} />
        )}
      </div>
    </>
  );
}
