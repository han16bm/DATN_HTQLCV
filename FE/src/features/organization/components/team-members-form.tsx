"use client";

import { Form } from "@/components/forms/form";
import { FormMultiSelect, FormTextarea } from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useReplaceTeamMembersMutation } from "../hooks/use-organization-mutations";
import { teamMembersSchema } from "../schemas/team.schema";
import { type TeamDto } from "../types/organization.types";
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
  const form = useForm({
    resolver: zodResolver(teamMembersSchema, { error: validationMessage }),
    defaultValues: { memberIds: team.memberIds },
  });
  const { errors } = form.formState;
  return (
    <Form
      compact
      form={form}
      compareFields={[
        {
          name: "memberIds",
          label: "Thành viên",
          options: people.filter((p) => p.parentValue === snapshot.base.unitId),
        },
        { name: "reason", label: "Lý do thay đổi thành viên" },
      ]}
      cancel={cancel}
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
    >
      <Controller
        name="memberIds"
        control={form.control}
        render={({ field }) => (
          <FormMultiSelect
            label="Thành viên"
            options={people.filter(
              (p) => p.parentValue === snapshot.base.unitId,
            )}
            {...field}
            error={errors.memberIds}
          />
        )}
      />
      <FormTextarea
        label="Lý do thay đổi thành viên"
        required
        {...form.register("reason")}
        error={errors.reason}
      />
    </Form>
  );
}
