"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { SplitLayout } from "@/components/patterns/split-layout";
import { PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUnitsQuery } from "@/features/organization/hooks/use-organization-queries";
import { useCrumbLabel } from "@/lib/use-crumb-label";
import { useGetUserQuery } from "../hooks/use-users-queries";
import { UserCommands } from "./user-commands";
import { UserProfileForm } from "./user-profile-form";
import { UserWorkInfo } from "./user-work-info";

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
  const form = (
    <UserProfileForm
      key={userId ?? "new"}
      user={query.data}
      units={units.data.items.map((u) => ({ value: u.id, label: u.name }))}
      reload={() => query.refetch()}
    />
  );
  return (
    <>
      <PageHeader
        title={userId ? "Chi tiết tài khoản" : "Cấp tài khoản nội bộ"}
      />
      {query.data ? (
        <SplitLayout
          aside={
            <div className="grid gap-5">
              <Panel title="Thông tin công việc">
                <UserWorkInfo
                  unit={query.data.unit.name}
                  systemRole={query.data.systemRole}
                  teams={query.data.teams}
                  projects={query.data.projects}
                />
              </Panel>
              <UserCommands user={query.data} reload={query.refetch} />
            </div>
          }
        >
          {form}
        </SplitLayout>
      ) : (
        form
      )}
    </>
  );
}
