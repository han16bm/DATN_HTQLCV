"use client";
import { SchemaForm } from "@/components/forms/schema-form";
import { HashDialog } from "@/components/ui/dialog";
import {
  DataTable,
  Loading,
  PageHeader,
  Pagination,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { addMemberSchema } from "@/features/project-members/schemas/project-members.schema";
import { type MembershipDto } from "@/features/project-members/types/project-members.types";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { hasPermission, useSession } from "@/lib/auth/session-context";
import { dateTime, label } from "@/lib/format";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { reasonSchema } from "@/lib/validation/common.schema";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddProjectMemberMutation,
  useEndProjectMembershipMutation,
} from "../hooks/use-project-members-mutations";
import { useListProjectMembersQuery } from "../hooks/use-project-members-queries";

export function ProjectMembersPage({ projectId }: { projectId: string }) {
  const filters = useUrlFilters();
  const project = useGetProjectQuery(projectId);
  const { session } = useSession();
  const dialog = useHashDialog();
  const query = useListProjectMembersQuery(projectId, { page: filters.page });
  const add = useAddProjectMemberMutation();
  const end = useEndProjectMembershipMutation();
  const [ending, setEnding] = useState<MembershipDto | null>(null);
  const manage =
    hasPermission(session, "MEMBERS_MANAGE", projectId) &&
    Boolean(
      project.data && ["PLANNED", "ACTIVE"].includes(project.data.status),
    );
  return (
    <>
      <PageHeader
        title="Thành viên dự án"
        description="Quyền được cấp riêng trên từng dự án."
        actions={
          manage && (
            <button
              className="primary"
              onClick={() => dialog.open("add-member")}
            >
              Thêm thành viên
            </button>
          )
        }
      />
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <Loading />
      ) : (
        <section className="panel">
          <DataTable
            headers={[
              "Thành viên",
              "Vai trò dự án",
              "Quyền nghiệp vụ",
              "Tư cách",
              "",
            ]}
            rows={query.data.items.map((m) => [
              <div key="person">
                {m.user.displayName}
                <div className="small muted">{m.userId}</div>
              </div>,
              label(m.projectRole),
              m.permissions.length
                ? `${m.permissions.length} quyền`
                : "Theo việc được giao",
              m.endedAt
                ? `Đã kết thúc ${dateTime(m.endedAt)}`
                : "Đang tham gia",
              manage && (
                <div key="actions" className="actions">
                  <Link
                    className="text-link"
                    href={`/projects/${projectId}/permissions?member=${m.id}`}
                  >
                    {m.projectRole === "OWNER" ? "Xem quyền" : "Phân quyền"}
                  </Link>
                  {!m.endedAt && m.projectRole !== "OWNER" && (
                    <>
                      <Link
                        className="text-link"
                        href={`/tasks?projectId=${projectId}&assigneeId=${m.userId}`}
                      >
                        Bàn giao việc
                      </Link>
                      <button
                        onClick={() => {
                          setEnding(m);
                          dialog.open("end-member");
                        }}
                      >
                        Kết thúc
                      </button>
                    </>
                  )}
                </div>
              ),
            ])}
          />
          <Pagination
            {...query.data.pagination}
            onPage={(p) => filters.set("page", String(p))}
          />
        </section>
      )}
      <div className="hint">
        Bàn giao các công việc mở trước khi kết thúc tư cách. Giờ công và lịch
        sử phân công được giữ lại.
      </div>
      {manage && (
        <>
          <HashDialog name="add-member" title="Thêm thành viên dự án">
            <SchemaForm
              schema={addMemberSchema.omit({ permissions: true })}
              fields={[
                {
                  name: "userId",
                  label: "Mã tài khoản nội bộ",
                  required: true,
                  hint: "Dùng mã tài khoản do quản trị viên cung cấp; hệ thống kiểm tra tài khoản hoạt động trước khi thêm.",
                },
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
              ]}
              defaults={{ projectRole: "MEMBER" }}
              onSubmit={async (values) => {
                await add.mutateAsync({
                  projectId: projectId,
                  payload: addMemberSchema.parse({
                    ...values,
                    permissions: [],
                  }),
                });
                toast.success(
                  "Đã thêm thành viên. Cấp thêm quyền ở màn phân quyền.",
                );
                dialog.close();
              }}
              submitLabel="Thêm thành viên"
            />
          </HashDialog>
          <HashDialog name="end-member" title="Kết thúc tư cách thành viên">
            {ending && (
              <>
                <p>{ending.user.displayName}</p>
                <SchemaForm
                  key={ending.id}
                  schema={reasonSchema}
                  fields={[
                    {
                      name: "reason",
                      label: "Lý do kết thúc",
                      type: "textarea",
                      required: true,
                    },
                  ]}
                  onSubmit={async (values) => {
                    await end.mutateAsync({
                      projectId: projectId,
                      membershipId: ending.id,
                      payload: values,
                      version: ending.version,
                    });
                    toast.success("Đã kết thúc tư cách thành viên.");
                    dialog.close();
                  }}
                  submitLabel="Xác nhận kết thúc"
                />
              </>
            )}
          </HashDialog>
        </>
      )}
    </>
  );
}
