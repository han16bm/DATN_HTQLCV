"use client";
import type { FormOption } from "@/components/forms/form.types";
import { SchemaForm } from "@/components/forms/schema-form";
import { teamMembersSchema } from "@/features/organization/schemas/team.schema";
import { type TeamDto } from "@/features/organization/types/organization.types";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { toast } from "sonner";
import { useReplaceTeamMembersMutation } from "../hooks/use-organization-mutations";
import type { ReactNode } from "react";
export function TeamMembersForm({
  team,
  people,
  reload,
  cancel,
  onDone,
}: {
  team: TeamDto;
  people: FormOption[];
  reload?: () => Promise<{
    data?: TeamDto;
  }>;
  cancel?: ReactNode;
  onDone: () => void;
}) {
  const snapshot = useEditSnapshot(team);
  const mutation = useReplaceTeamMembersMutation();
  return (
    <SchemaForm
      schema={teamMembersSchema}
      cancel={cancel}
      fields={[
        {
          name: "memberIds",
          label: "Thành viên",
          type: "multi",
          options: people.filter((p) => p.parentValue === snapshot.base.unitId),
        },
        {
          name: "reason",
          label: "Lý do thay đổi thành viên",
          type: "textarea",
          required: true,
        },
      ]}
      defaults={{ memberIds: team.memberIds }}
      onConflictReload={reload ? () => snapshot.load(reload) : undefined}
      onConflictAccept={snapshot.accept}
      onSubmit={async (values) => {
        snapshot.saved(
          await mutation.mutateAsync({
            teamId: team.id,
            payload: values,
            version: snapshot.base.version,
          }),
        );
        toast.success("Đã cập nhật thành viên nhóm.");
        onDone();
      }}
      submitLabel="Lưu thành viên"
    />
  );
}
