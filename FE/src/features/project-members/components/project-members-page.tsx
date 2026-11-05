"use client";
import { FilterBar, FilterField } from "@/components/patterns/filter-bar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { MenuContent, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { SearchInput } from "@/components/ui/input";
import { hasPermission } from "@/lib/auth/access";

import { Form } from "@/components/forms/form";
import { FormInput, FormSelect } from "@/components/forms/form-field";
import { ReasonForm } from "@/components/forms/reason-form";
import { HashDialog } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { DataTable } from "@/components/patterns/data-table";
import { PageHeader } from "@/components/ui/page";
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

export function ProjectMembersPage({
  projectId,
  inDrawer = false,
}: {
  projectId: string;
  inDrawer?: boolean;
}) {
  const filters = useUrlFilters("members.");
  const project = useGetProjectQuery(projectId);
  const { session } = useSession();
  const dialog = useHashDialog();
  const closeForm = () => (inDrawer ? dialog.open("members") : dialog.close());
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
      <PageHeader
        title={inDrawer ? "Danh sách thành viên" : "Thành viên dự án"}
        level={2}
        actions={
          manage && (
            <Button
              variant="primary"
              onClick={() => {
                form.reset();
                dialog.open("add-member");
              }}
            >
              Thêm thành viên
            </Button>
          )
        }
      />
      <FilterBar label="Tìm thành viên">
        <FilterField label="Tìm thành viên" search>
          <SearchInput
            placeholder="Nhập tên thành viên…"
            value={filters.get("q")}
            onChange={(e) => filters.set("q", e.target.value)}
          />
        </FilterField>
      </FilterBar>
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : (
        <DataTable
          loading={query.isFetching}
          pagination={{
            ...query.data.pagination,
            onPage: (p) => filters.set("page", String(p)),
          }}
          widths={[65, 35]}
          headers={["Thành viên", "Vai trò"]}
          rows={query.data.items.map((m) => [
            <div
              key="person"
              className="flex min-w-0 items-center justify-between gap-2"
            >
              <UserBadge
                name={m.user.displayName}
                href={`/users/${encodeURIComponent(m.user.id)}`}
              />
              {manage && !m.endedAt && m.projectRole !== "OWNER" && (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <IconButton label={`Thao tác ${m.user.displayName}`}>
                      <Ellipsis className="size-[17px]" aria-hidden="true" />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <MenuContent sideOffset={6}>
                    <MenuItem
                      onSelect={() => {
                        setEditing(m);
                        dialog.open("member-role");
                      }}
                    >
                      Đổi vai trò
                    </MenuItem>
                    <MenuItem asChild>
                      <Link
                        href={`/projects/${encodeURIComponent(projectId)}?assigneeId=${encodeURIComponent(m.userId)}#tasks`}
                      >
                        Bàn giao việc
                      </Link>
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem
                      tone="danger"
                      onSelect={() => {
                        setEnding(m);
                        dialog.open("end-member");
                      }}
                    >
                      Kết thúc
                    </MenuItem>
                  </MenuContent>
                </DropdownMenu.Root>
              )}
            </div>,
            <div key="role" className="grid gap-0.5">
              <span>{label(m.projectRole)}</span>
              <span className="text-xs text-fg-subtle">
                {m.endedAt
                  ? `Đã kết thúc ${dateTime(m.endedAt)}`
                  : "Đang tham gia"}
              </span>
            </div>,
          ])}
        />
      )}
      {manage && (
        <>
          <HashDialog
            name="add-member"
            title="Thêm thành viên dự án"
            returnTo={inDrawer ? "members" : undefined}
          >
            <Form
              compact
              form={form}
              onSubmit={async (values) => {
                await add.mutateAsync({
                  projectId,
                  payload: values,
                });
                toast.success("Đã thêm thành viên dự án.");
                closeForm();
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
          <HashDialog
            name="member-role"
            title="Đổi vai trò thành viên"
            returnTo={inDrawer ? "members" : undefined}
          >
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
                  onDone={closeForm}
                />
              </>
            )}
          </HashDialog>
          <HashDialog
            name="end-member"
            title="Kết thúc tư cách thành viên"
            returnTo={inDrawer ? "members" : undefined}
          >
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
                  onDone={closeForm}
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
