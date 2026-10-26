"use client";

import { PageSkeleton } from "@/components/ui/loading";
import { ButtonLink, PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { useRouter } from "next/navigation";
import {
  useGetTeamQuery,
  useListUnitsQuery,
} from "../hooks/use-organization-queries";
import { TeamForm } from "./team-form";

export function TeamEditorPage({ teamId }: { teamId?: string }) {
  const router = useRouter();
  const query = useGetTeamQuery(teamId ?? "");
  const units = useListUnitsQuery({ pageSize: 100 });
  const users = useListUsersQuery({ pageSize: 100, status: "ACTIVE" });
  if (query.isError)
    return (
      <QueryErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (units.isError)
    return (
      <QueryErrorState error={units.error} retry={() => void units.refetch()} />
    );
  if (users.isError)
    return (
      <QueryErrorState error={users.error} retry={() => void users.refetch()} />
    );
  if (!units.data || !users.data || (teamId && query.isPending))
    return <PageSkeleton variant="form" />;
  return (
    <>
      <PageHeader
        title={teamId ? "Chi tiết nhóm" : "Tạo nhóm"}
        actions={<ButtonLink href="/admin/teams">Danh sách nhóm</ButtonLink>}
      />
      <TeamForm
        key={teamId ?? "new"}
        team={query.data}
        units={units.data.items}
        people={users.data.items.map((user) => ({
          value: user.id,
          label: user.displayName,
          parentValue: user.unitId,
        }))}
        reload={() => query.refetch()}
        onCreated={(id) =>
          router.push(`/admin/teams/${encodeURIComponent(id)}`)
        }
      />
    </>
  );
}
