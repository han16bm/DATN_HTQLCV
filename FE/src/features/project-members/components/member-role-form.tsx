"use client";

import { Form } from "@/components/forms/form";
import { FormSelect, FormTextarea } from "@/components/forms/form-field";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateProjectMemberRoleMutation } from "../hooks/use-project-members-mutations";
import { memberRoleSchema } from "../schemas/project-members.schema";
import type {
  MembershipDto,
  UpdateProjectMemberRoleInput,
} from "../types/project-members.types";

export const memberRoles = [
  { value: "MEMBER", label: "Thành viên" },
  { value: "MANAGER", label: "Quản lý" },
];

export function MemberRoleForm({
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
  const mutation = useUpdateProjectMemberRoleMutation();
  const snapshot = useEditSnapshot(member);
  const form = useForm<UpdateProjectMemberRoleInput>({
    resolver: zodResolver(memberRoleSchema, { error: validationMessage }),
    defaultValues: {
      projectRole:
        member.projectRole === "OWNER" ? "MANAGER" : member.projectRole,
      reason: "",
    },
  });
  return (
    <Form
      compact
      form={form}
      compareFields={[
        { name: "projectRole", label: "Vai trò dự án", options: memberRoles },
        { name: "reason", label: "Lý do thay đổi" },
      ]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async (values) => {
        await mutation.mutateAsync({
          projectId,
          membershipId: member.id,
          payload: values,
          version: snapshot.base.version,
        });
        toast.success("Đã cập nhật vai trò thành viên.");
        onDone();
      }}
      submitLabel="Lưu vai trò"
    >
      <FormSelect
        label="Vai trò dự án"
        required
        hint="Vai trò quản lý dành cho Leader/PM, cho phép quản lý công việc và thành viên trong dự án."
        options={memberRoles}
        {...form.register("projectRole")}
        error={form.formState.errors.projectRole}
      />
      <FormTextarea
        label="Lý do thay đổi"
        required
        {...form.register("reason")}
        error={form.formState.errors.reason}
      />
    </Form>
  );
}
