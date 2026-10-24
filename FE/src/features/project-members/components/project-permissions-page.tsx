"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { PermissionGate } from "@/components/layout/permission-gate";
import { Empty, Loading, PageHeader, Panel } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { memberPermissionsSchema } from "@/features/project-members/schemas/project-members.schema";
import { type MembershipDto } from "@/features/project-members/types/project-members.types";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUpdateProjectMemberPermissionsMutation } from "../hooks/use-project-members-mutations";
import { useListProjectMembersQuery } from "../hooks/use-project-members-queries";

export const permissionLabels: Record<string, string> = {
  PROJECT_MANAGE: "Quản lý kế hoạch dự án",
  MEMBERS_MANAGE: "Quản lý thành viên",
  TASKS_MANAGE: "Quản lý công việc",
  TASKS_REVIEW: "Nghiệm thu kết quả",
  ANALYTICS_VIEW: "Xem thống kê và AI",
  ALERTS_MANAGE: "Xử lý cảnh báo",
};
export function ProjectPermissionsPage({ projectId }: { projectId: string }) {
  return (
    <PermissionGate permission="MEMBERS_MANAGE" projectId={projectId}>
      <PermissionsWorkspace projectId={projectId} />
    </PermissionGate>
  );
}
function PermissionsWorkspace({ projectId }: { projectId: string }) {
  const filters = useUrlFilters();
  const project = useGetProjectQuery(projectId);
  const query = useListProjectMembersQuery(projectId, { pageSize: 100 });
  const { session } = useSession();
  const selected =
    query.data?.items.find((m) => m.id === filters.get("member")) ??
    query.data?.items[0];
  if (project.isError) return <QueryErrorState error={project.error} />;
  if (!project.data) return <Loading />;
  if (!["PLANNED", "ACTIVE"].includes(project.data.status))
    return (
      <Panel>
        <p>
          Dự án đã đóng, quyền thành viên chỉ được tra cứu ở danh sách thành
          viên.
        </p>
      </Panel>
    );
  return (
    <>
      <PageHeader
        title="Quyền trên dự án"
        description="Chỉ cấp quyền trong phạm vi được ủy quyền. Người xét luôn phải khác người nộp."
      />
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <Loading />
      ) : (
        <Panel>
          <label>
            Thành viên
            <select
              value={selected?.id ?? ""}
              onChange={(e) => {
                if (confirmDiscard()) filters.set("member", e.target.value);
              }}
            >
              {query.data.items.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user.displayName}
                  {m.endedAt ? " (đã kết thúc)" : ""}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <PermissionsForm
              key={selected.id}
              projectId={projectId}
              member={selected}
              allowed={
                session?.projectAccess.find((p) => p.projectId === projectId)
                  ?.permissions ?? []
              }
              reload={async () => ({
                data: (await query.refetch()).data?.items.find(
                  (m) => m.id === selected.id,
                ),
              })}
            />
          ) : (
            <Empty />
          )}
        </Panel>
      )}
    </>
  );
}
function PermissionsForm({
  projectId,
  member,
  allowed,
  reload,
}: {
  projectId: string;
  member: MembershipDto;
  allowed: string[];
  reload: () => Promise<{
    data?: MembershipDto;
  }>;
}) {
  const mutation = useUpdateProjectMemberPermissionsMutation();
  const snapshot = useEditSnapshot(member);
  const router = useRouter();
  if (member.projectRole === "OWNER" || member.endedAt)
    return (
      <div className="hint">
        {member.projectRole === "OWNER"
          ? "Người phụ trách có các quyền quản lý dự án. Đổi người phụ trách ở màn điều chỉnh dự án."
          : "Thành viên đã kết thúc tư cách, không thể thay đổi quyền."}
        <ul>
          {member.permissions.map((p) => (
            <li key={p}>{permissionLabels[p] ?? p}</li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="section-gap">
      <SchemaForm
        schema={memberPermissionsSchema}
        fields={[
          {
            name: "projectRole",
            label: "Vai trò dự án",
            type: "select",
            required: true,
            options: [
              { value: "MEMBER", label: "Thành viên" },
              { value: "MANAGER", label: "Quản lý" },
            ],
          },
          {
            name: "permissions",
            label: "Quyền nghiệp vụ",
            type: "multi",
            options: allowed
              .filter((p) => p in permissionLabels)
              .map((p) => ({ value: p, label: permissionLabels[p] })),
          },
          {
            name: "reason",
            label: "Lý do thay đổi",
            type: "textarea",
            required: true,
          },
        ]}
        defaults={{
          projectRole: member.projectRole,
          permissions: member.permissions,
        }}
        onConflictReload={() => snapshot.load(reload)}
        onConflictAccept={snapshot.accept}
        onSubmit={async (values) => {
          await mutation.mutateAsync({
            projectId,
            membershipId: member.id,
            payload: values,
            version: snapshot.base.version,
          });
          toast.success("Đã cập nhật quyền.");
          router.push(`/projects/${projectId}/members`);
        }}
        submitLabel="Lưu quyền"
      />
    </div>
  );
}
