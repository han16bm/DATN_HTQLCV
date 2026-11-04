"use client";
import { DataTable } from "@/components/patterns/data-table";
import { Select } from "@/components/ui/select";

import { Form } from "@/components/forms/form";
import { FormMultiSelect, FormTextarea } from "@/components/forms/form-field";
import { PageSkeleton } from "@/components/ui/loading";

import { QueryErrorState } from "@/components/ui/query-error-state";
import {
  FeatureName,
  featureTree,
} from "@/features/permissions/components/feature-tree";
import {
  useListFeaturesQuery,
  useListPermissionGroupsQuery,
} from "@/features/permissions/hooks/use-permissions-queries";
import type {
  FeatureDto,
  PermissionGroupDto,
} from "@/features/permissions/types/permissions.types";
import { useSession } from "@/lib/auth/session-context";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateUserPermissionsMutation } from "../hooks/use-users-mutations";
import { useGetUserPermissionsQuery } from "../hooks/use-users-queries";
import { updateUserPermissionsSchema } from "../schemas/user-permissions.schema";
import type {
  UpdateUserPermissionsInput,
  UserPermissionsDto,
} from "../types/users.types";

export function UserPermissionsPanel({
  userId,
  readOnly = false,
}: {
  userId: string;
  readOnly?: boolean;
}) {
  const query = useGetUserPermissionsQuery(userId);
  const features = useListFeaturesQuery();
  // Giới hạn 100 nhóm cho ô chọn; nhóm hiện có của người dùng luôn được giữ.
  const groups = useListPermissionGroupsQuery({ pageSize: 100 });
  for (const item of [query, features, groups])
    if (item.isError)
      return <QueryErrorState error={item.error} retry={item.refetch} />;
  if (!query.data || !features.data || !groups.data)
    return <PageSkeleton variant="form" />;
  return (
    <PermissionsForm
      key={query.data.version}
      value={query.data}
      features={features.data}
      groups={groups.data.items}
      readOnly={readOnly}
      reload={() => query.refetch()}
    />
  );
}

const states = [
  { value: "INHERIT", label: "Theo nhóm" },
  { value: "GRANT", label: "Cộng thêm" },
  { value: "REVOKE", label: "Thu hồi" },
] as const;

function PermissionsForm({
  value,
  features,
  groups,
  readOnly,
  reload,
}: {
  readOnly: boolean;
  value: UserPermissionsDto;
  features: FeatureDto[];
  groups: PermissionGroupDto[];
  reload: () => Promise<{ data?: UserPermissionsDto }>;
}) {
  const { session } = useSession();
  const snapshot = useEditSnapshot(value);
  const mutation = useUpdateUserPermissionsMutation();
  const form = useForm<UpdateUserPermissionsInput>({
    resolver: zodResolver(updateUserPermissionsSchema, {
      error: validationMessage,
    }),
    defaultValues: {
      isSysAdmin: value.isSysAdmin,
      groupIds: value.groups.map((g) => g.id),
      grantedFeatures: value.grantedFeatures,
      revokedFeatures: value.revokedFeatures,
      reason: "",
    },
  });
  const [isSysAdmin, groupIds, grantedFeatures, revokedFeatures] = useWatch({
    control: form.control,
    name: ["isSysAdmin", "groupIds", "grantedFeatures", "revokedFeatures"],
  });
  const draft = { isSysAdmin, groupIds, grantedFeatures, revokedFeatures };
  const groupOptions = [
    ...groups.map((g) => ({
      value: g.id,
      label: g.status === "ACTIVE" ? g.name : `${g.name} (ngừng sử dụng)`,
    })),
    ...value.groups
      .filter((g) => !groups.some((item) => item.id === g.id))
      .map((g) => ({ value: g.id, label: g.label })),
  ];
  // Xem trước theo công thức quyền hiệu lực (ADMIN_MODULES 1.2); BE vẫn tính lại.
  const fromGroups = new Set(
    groups
      .filter((g) => g.status === "ACTIVE" && draft.groupIds.includes(g.id))
      .flatMap((g) => g.features),
  );
  const effective = (feature: FeatureDto) =>
    feature.isActive &&
    (draft.isSysAdmin ||
      ((fromGroups.has(feature.code) ||
        draft.grantedFeatures.includes(feature.code)) &&
        !draft.revokedFeatures.includes(feature.code)));
  const stateOf = (code: string) =>
    draft.revokedFeatures.includes(code)
      ? "REVOKE"
      : draft.grantedFeatures.includes(code)
        ? "GRANT"
        : "INHERIT";
  const setState = (code: string, state: string) => {
    const without = (list: string[]) => list.filter((item) => item !== code);
    const options = { shouldDirty: true };
    form.setValue(
      "grantedFeatures",
      state === "GRANT"
        ? [...without(draft.grantedFeatures), code]
        : without(draft.grantedFeatures),
      options,
    );
    form.setValue(
      "revokedFeatures",
      state === "REVOKE"
        ? [...without(draft.revokedFeatures), code]
        : without(draft.revokedFeatures),
      options,
    );
  };
  const { errors } = form.formState;
  return (
    <>
      <Form
        form={form}
        readOnly={readOnly}
        submitLabel="Lưu phân quyền"
        compareFields={[
          { name: "isSysAdmin", label: "Quản trị tối cao" },
          { name: "groups", label: "Nhóm quyền" },
          { name: "grantedFeatures", label: "Cộng thêm" },
          { name: "revokedFeatures", label: "Thu hồi" },
        ]}
        onConflictReload={async () => {
          const latest = await snapshot.load(reload);
          return { ...latest, groups: latest.groups.map((g) => g.label) };
        }}
        onConflictAccept={snapshot.accept}
        onSubmit={async (payload) => {
          snapshot.saved(
            await mutation.mutateAsync({
              userId: value.userId,
              payload,
              version: snapshot.base.version,
            }),
          );
          toast.success("Đã lưu phân quyền.");
        }}
      >
        {session?.user.isSysAdmin && (
          <label className="col-span-12 flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              className="size-4 accent-(--color-action)"
              {...form.register("isSysAdmin")}
            />
            Quản trị tối cao (Sysadmin) — có mọi mã quyền đang bật
          </label>
        )}
        <Controller
          name="groupIds"
          control={form.control}
          render={({ field }) => (
            <FormMultiSelect
              label="Nhóm quyền"
              options={groupOptions}
              {...field}
              error={errors.groupIds}
            />
          )}
        />
        <div className="col-span-12 min-w-0">
          <DataTable
            title="Quyền theo từng mã"
            widths={[46, 14, 24, 16]}
            headers={["Chức năng", "Từ nhóm", "Thiết lập riêng", "Hiệu lực"]}
            rows={featureTree(features).map(({ feature, depth }) => [
              <span key="name" style={{ paddingLeft: depth * 24 }}>
                <FeatureName feature={feature} />
              </span>,
              feature.isGroup ? "" : fromGroups.has(feature.code) ? "Có" : "—",
              feature.isGroup ? null : (
                <Select
                  key="state"
                  aria-label={`Thiết lập riêng cho ${feature.name}`}
                  value={stateOf(feature.code)}
                  onChange={(event) =>
                    setState(feature.code, event.target.value)
                  }
                >
                  {states.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </Select>
              ),
              feature.isGroup ? (
                ""
              ) : effective(feature) ? (
                <span
                  key="on"
                  className="inline-flex items-center rounded-sm px-1.5 py-px text-xs leading-4 font-semibold whitespace-nowrap bg-success-bg text-success-fg"
                >
                  Có hiệu lực
                </span>
              ) : (
                <span
                  key="off"
                  className="inline-flex items-center rounded-sm px-1.5 py-px text-xs leading-4 font-semibold whitespace-nowrap bg-sunken text-fg-subtle"
                >
                  Không
                </span>
              ),
            ])}
          />
        </div>
        {!readOnly && (
          <FormTextarea
            label="Lý do"
            required
            {...form.register("reason")}
            error={errors.reason}
          />
        )}
      </Form>
    </>
  );
}
