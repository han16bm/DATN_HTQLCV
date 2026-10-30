"use client";
import { hasPermission } from "@/lib/auth/access";

import { Form } from "@/components/forms/form";
import { FormInput, FormSelect } from "@/components/forms/form-field";
import { ReasonForm } from "@/components/forms/reason-form";
import { HashDialog } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { DataTable } from "@/components/ui/page";
import { HeaderActions } from "@/components/ui/header-actions";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { UserBadge } from "@/components/ui/user-badge";
import { useGetProjectQuery } from "@/features/projects/hooks/use-projects-queries";
import { useSession } from "@/lib/auth/session-context";
import { dateTime, label } from "@/lib/format";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { zodResolver } from "@hookform/resolvers/zod";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  useAddProjectMemberMutation,
  useEndProjectMembershipMutation,
} from "../hooks/use-project-members-mutations";
import { useListProjectMembersQuery } from "../hooks/use-project-members-queries";
import { addMemberSchema } from "../schemas/project-members.schema";
import type {
  AddProjectMemberInput,
  MembershipDto,
} from "../types/project-members.types";
import { MemberRoleForm, memberRoles } from "./member-role-form";

export function ProjectMembersPage({ projectId }: { projectId: string }) {
  const filters = useUrlFilters();
  const project = useGetProjectQuery(projectId);
  const { session } = useSession();
  const dialog = useHashDialog();
  const query = useListProjectMembersQuery(projectId, {
    q: filters.get("q") || undefined,
    page: filters.page,
  });
  const add = useAddProjectMemberMutation();
  const [ending, setEnding] = useState<MembershipDto | null>(null);
  const [editing, setEditing] = useState<MembershipDto | null>(null);
  const form = useForm<AddProjectMemberInput>({
    resolver: zodResolver(addMemberSchema, { error: validationMessage }),
    defaultValues: { userId: "", projectRole: "MEMBER" },
  });
  const manage =
    hasPermission(session, "MEMBERS_MANAGE", projectId) &&
    Boolean(
      project.data && ["PLANNED", "ACTIVE"].includes(project.data.status),
    );
  return (
    <>
      <HeaderActions>
        {manage && (
          <button
            className="primary"
            onClick={() => {
              form.reset();
              dialog.open("add-member");
            }}
          >
            Thêm thành viên
          </button>
        )}
      </HeaderActions>
      <section className="filters" aria-label="Tìm thành viên">
        <label className="filter-search">
          Tìm thành viên
          <input
            type="search"
            placeholder="Nhập tên thành viên…"
            value={filters.get("q")}
            onChange={(e) => filters.set("q", e.target.value)}
          />
        </label>
      </section>
      {query.isError ? (
        <QueryErrorState
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filters.set("page", String(p)),
          }}
          actions
          widths={[35, 22, 27, 16]}
          headers={["Thành viên", "Vai trò dự án", "Tư cách", "Hành động"]}
          rows={query.data.items.map((m) => [
            <UserBadge
              key="person"
              name={m.user.displayName}
              href={`/users/${encodeURIComponent(m.user.id)}`}
            />,
            label(m.projectRole),
            m.endedAt ? `Đã kết thúc ${dateTime(m.endedAt)}` : "Đang tham gia",
            manage && !m.endedAt && m.projectRole !== "OWNER" && (
              <DropdownMenu.Root key="actions">
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Thao tác ${m.user.displayName}`}
                  >
                    <Ellipsis size={17} aria-hidden="true" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="account-menu"
                    align="end"
                    sideOffset={6}
                    collisionPadding={12}
                  >
                    <DropdownMenu.Item
                      className="account-menu-item"
                      onSelect={() => {
                        setEditing(m);
                        dialog.open("member-role");
                      }}
                    >
                      Đổi vai trò
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        className="account-menu-item"
                        href={`/projects/${projectId}/tasks?assigneeId=${m.userId}`}
                      >
                        Bàn giao việc
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="account-menu-separator" />
                    <DropdownMenu.Item
                      className="account-menu-item danger"
                      onSelect={() => {
                        setEnding(m);
                        dialog.open("end-member");
                      }}
                    >
                      Kết thúc
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ),
          ])}
        />
      )}
      {manage && (
        <>
          <HashDialog name="add-member" title="Thêm thành viên dự án">
            <Form
              compact
              form={form}
              onSubmit={async (values) => {
                await add.mutateAsync({
                  projectId,
                  payload: values,
                });
                toast.success("Đã thêm thành viên dự án.");
                dialog.close();
              }}
              submitLabel="Thêm thành viên"
            >
              <FormInput
                label="Mã tài khoản nội bộ"
                required
                hint="Dùng mã tài khoản do quản trị viên cung cấp; hệ thống kiểm tra tài khoản hoạt động trước khi thêm."
                {...form.register("userId")}
                error={form.formState.errors.userId}
              />
              <FormSelect
                label="Vai trò dự án"
                required
                options={memberRoles}
                {...form.register("projectRole")}
                error={form.formState.errors.projectRole}
              />
            </Form>
          </HashDialog>
          <HashDialog name="member-role" title="Đổi vai trò thành viên">
            {editing && (
              <>
                <UserBadge name={editing.user.displayName} />
                <MemberRoleForm
                  key={editing.id}
                  projectId={projectId}
                  member={editing}
                  reload={async () => ({
                    data: (await query.refetch()).data?.items.find(
                      (member) => member.id === editing.id,
                    ),
                  })}
                  onDone={dialog.close}
                />
              </>
            )}
          </HashDialog>
          <HashDialog name="end-member" title="Kết thúc tư cách thành viên">
            {ending && (
              <>
                <UserBadge name={ending.user.displayName} />
                <EndMemberForm
                  key={ending.id}
                  projectId={projectId}
                  member={ending}
                  reload={async () => ({
                    data: (await query.refetch()).data?.items.find(
                      (member) => member.id === ending.id,
                    ),
                  })}
                  onDone={dialog.close}
                />
              </>
            )}
          </HashDialog>
        </>
      )}
    </>
  );
}

function EndMemberForm({
  projectId,
  member,
  reload,
  onDone,
}: {
  projectId: string;
  member: MembershipDto;
  reload: () => Promise<{ data?: MembershipDto }>;
  onDone: () => void;
}) {
  const end = useEndProjectMembershipMutation();
  const snapshot = useEditSnapshot(member);
  return (
    <ReasonForm
      label="Lý do kết thúc"
      compareFields={[
        { name: "projectRole", label: "Vai trò dự án", options: memberRoles },
      ]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async (payload) => {
        await end.mutateAsync({
          projectId,
          membershipId: member.id,
          payload,
          version: snapshot.base.version,
        });
        toast.success("Đã kết thúc tư cách thành viên.");
        onDone();
      }}
      submitLabel="Xác nhận kết thúc"
    />
  );
}
