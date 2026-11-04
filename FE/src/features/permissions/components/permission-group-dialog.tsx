"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormMultiSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import type { FormOption } from "@/components/forms/form.types";
import { ReasonForm } from "@/components/forms/reason-form";
import {
  DialogFooter,
  DialogTabs,
  EntityDialog,
} from "@/components/ui/entity-dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { StatusField } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { RecordStamp } from "@/components/ui/record-stamp";
import { useListUsersQuery } from "@/features/users/hooks/use-users-queries";
import { changedFields } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  useCreatePermissionGroupMutation,
  useReplacePermissionGroupMembersMutation,
  useSetPermissionGroupStatusMutation,
  useUpdatePermissionGroupMutation,
} from "../hooks/use-permissions-mutations";
import {
  useGetPermissionGroupQuery,
  useListFeaturesQuery,
} from "../hooks/use-permissions-queries";
import {
  createPermissionGroupSchema,
  permissionGroupMembersSchema,
  updatePermissionGroupSchema,
} from "../schemas/permission-group.schema";
import type {
  FeatureDto,
  PermissionGroupDto,
} from "../types/permissions.types";
import { FeatureChecklist } from "./feature-tree";

type Reload = () => Promise<{ data?: PermissionGroupDto }>;
type Tab = "info" | "features" | "members";

// Dialog Thêm/Xem/Sửa nhóm quyền, tab Thông tin / Quyền / Thành viên.
export function PermissionGroupDialog() {
  const dialog = useEntityDialog();
  if (!dialog.mode) return null;
  return <GroupDialogBody key={`${dialog.mode}:${dialog.id}`} />;
}

function GroupDialogBody() {
  const dialog = useEntityDialog();
  const mode = dialog.mode!;
  const [tab, setTab] = useState<Tab>("info");
  const [statusOpen, setStatusOpen] = useState(false);
  const query = useGetPermissionGroupQuery(dialog.id);
  const features = useListFeaturesQuery();
  // Giới hạn lookup 100 tài khoản; thành viên hiện có luôn được thêm vào lựa chọn.
  const users = useListUsersQuery({ pageSize: 100 });
  const group = query.data;
  const failed = [query, features, users].find((item) => item.isError);
  const lookup = users.data?.items ?? [];
  const people: FormOption[] = [
    ...lookup.map((u) => ({ value: u.id, label: u.displayName })),
    ...(group?.members ?? [])
      .filter((m) => !lookup.some((u) => u.id === m.id))
      .map((m) => ({ value: m.id, label: m.label })),
  ];
  const readOnly = mode === "view";
  const onCancel = async () => {
    if (!(await confirmDiscard())) return;
    if (mode === "edit") dialog.switchTo("view", dialog.id);
    else dialog.close();
  };
  const cancel = (
    <Button type="button" onClick={onCancel}>
      Hủy
    </Button>
  );
  const reload: Reload = () => query.refetch();
  const saved = () => dialog.switchTo("view", dialog.id);
  let body: ReactNode;
  if (failed?.error)
    body = <QueryErrorState error={failed.error} retry={failed.refetch} />;
  else if (!features.data || !users.data || (mode !== "create" && !group))
    body = <PageSkeleton variant="form" />;
  else if (!group)
    body = (
      <CreateGroup
        features={features.data}
        people={people}
        cancel={cancel}
        onCreated={(id) => dialog.switchTo("view", id)}
      />
    );
  else if (statusOpen)
    body = (
      <GroupStatusForm
        group={group}
        reload={reload}
        onDone={() => setStatusOpen(false)}
      />
    );
  else
    body = (
      <>
        <DialogTabs
          label="Mục nhóm quyền"
          value={tab}
          onChange={setTab}
          items={[
            { value: "info", label: "Thông tin" },
            { value: "features", label: "Quyền" },
            { value: "members", label: "Thành viên" },
          ]}
        />
        {tab === "info" ? (
          <GroupInfoForm
            group={group}
            readOnly={readOnly}
            reload={reload}
            cancel={cancel}
            onSaved={saved}
          />
        ) : tab === "features" ? (
          <GroupFeaturesForm
            group={group}
            features={features.data}
            readOnly={readOnly}
            reload={reload}
            cancel={cancel}
            onSaved={saved}
          />
        ) : (
          <GroupMembersForm
            group={group}
            people={people}
            readOnly={readOnly}
            reload={reload}
            cancel={cancel}
            onSaved={saved}
          />
        )}
        {readOnly && (
          <DialogFooter>
            <Button type="button" onClick={dialog.close}>
              Đóng
            </Button>
            {(group.status !== "ACTIVE" || !group.isSystem) && (
              <Button
                type="button"
                className={group.status === "ACTIVE" ? "danger" : undefined}
                onClick={() => setStatusOpen(true)}
              >
                {group.status === "ACTIVE" ? "Ngừng sử dụng" : "Kích hoạt"}
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={() => dialog.switchTo("edit", dialog.id)}
            >
              Chỉnh sửa
            </Button>
          </DialogFooter>
        )}
      </>
    );
  return (
    <EntityDialog
      open
      size="lg"
      title={
        mode === "create" ? "Tạo nhóm quyền" : (group?.name ?? "Nhóm quyền")
      }
      status={group && <StatusField value={group.status} />}
      stamp={
        group && (
          <RecordStamp
            createdBy={group.createdBy}
            createdAt={group.createdAt}
            updatedBy={group.updatedBy}
            updatedAt={group.updatedAt}
          />
        )
      }
      onClose={dialog.close}
    >
      {body}
    </EntityDialog>
  );
}

function CreateGroup({
  features,
  people,
  cancel,
  onCreated,
}: {
  features: FeatureDto[];
  people: FormOption[];
  cancel: ReactNode;
  onCreated: (id: string) => void;
}) {
  const create = useCreatePermissionGroupMutation();
  type Values = z.input<typeof createPermissionGroupSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(createPermissionGroupSchema, {
      error: validationMessage,
    }),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      features: [],
      memberIds: [],
    },
  });
  const { errors } = form.formState;
  return (
    <Form
      form={form}
      submitLabel="Tạo nhóm quyền"
      cancel={cancel}
      onSubmit={async (values) => {
        const group = await create.mutateAsync({
          ...values,
          description: values.description || null,
        });
        toast.success("Đã tạo nhóm quyền.");
        onCreated(group.id);
      }}
    >
      <FormInput
        label="Mã nhóm"
        required
        width="short"
        hint="Chữ in hoa, số và dấu gạch dưới, ví dụ KE_TOAN."
        {...form.register("code")}
        error={errors.code}
      />
      <FormInput
        label="Tên nhóm"
        required
        width="long"
        {...form.register("name")}
        error={errors.name}
      />
      <FormTextarea
        label="Mô tả"
        {...form.register("description")}
        error={errors.description}
      />
      <Controller
        name="features"
        control={form.control}
        render={({ field }) => (
          <div className="col-span-12 min-w-0">
            <span className="mb-1.5 block text-sm font-medium text-fg">
              Quyền
            </span>
            <FeatureChecklist
              features={features}
              value={field.value}
              onChange={field.onChange}
            />
          </div>
        )}
      />
      <Controller
        name="memberIds"
        control={form.control}
        render={({ field }) => (
          <FormMultiSelect
            label="Thành viên"
            options={people}
            {...field}
            error={errors.memberIds}
          />
        )}
      />
    </Form>
  );
}

type TabProps = {
  group: PermissionGroupDto;
  readOnly: boolean;
  reload: Reload;
  cancel: ReactNode;
  onSaved: () => void;
};

const infoSchema = updatePermissionGroupSchema
  .pick({ name: true, description: true, reason: true })
  .required({ name: true });
function GroupInfoForm({ group, readOnly, reload, cancel, onSaved }: TabProps) {
  const snapshot = useEditSnapshot(group);
  const update = useUpdatePermissionGroupMutation();
  const form = useForm<z.input<typeof infoSchema>>({
    resolver: zodResolver(infoSchema, { error: validationMessage }),
    defaultValues: {
      name: group.name,
      description: group.description ?? "",
      reason: "",
    },
  });
  const { errors } = form.formState;
  return (
    <Form
      form={form}
      readOnly={readOnly}
      cancel={cancel}
      compareFields={[
        { name: "name", label: "Tên nhóm" },
        { name: "description", label: "Mô tả" },
      ]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async ({ reason, ...values }) => {
        const base = snapshot.base;
        await update.mutateAsync({
          groupId: base.id,
          version: base.version,
          payload: {
            ...changedFields(
              { name: base.name, description: base.description ?? "" },
              values,
              ["name", "description"],
            ),
            ...(reason ? { reason } : {}),
          },
        });
        toast.success("Đã lưu nhóm quyền.");
        onSaved();
      }}
    >
      <div className="col-span-12 min-w-0 @min-[420px]/form:col-span-6 @min-[600px]/form:col-span-4">
        <label htmlFor={`code-${group.id}`}>Mã nhóm</label>
        <Input id={`code-${group.id}`} value={group.code} disabled readOnly />
        <p className="text-xs text-fg-subtle">
          {group.isSystem
            ? "Nhóm hệ thống, không được ngừng sử dụng."
            : `${group.members.length} thành viên`}
        </p>
      </div>
      <FormInput
        label="Tên nhóm"
        required
        width="long"
        {...form.register("name")}
        error={errors.name}
      />
      <FormTextarea
        label="Mô tả"
        {...form.register("description")}
        error={errors.description}
      />
      {!readOnly && (
        <FormTextarea
          label="Lý do"
          {...form.register("reason")}
          error={errors.reason}
        />
      )}
    </Form>
  );
}

const featuresSchema = updatePermissionGroupSchema
  .pick({ features: true, reason: true })
  .required({ features: true });
function GroupFeaturesForm({
  features,
  ...props
}: TabProps & { features: FeatureDto[] }) {
  const { group, readOnly, reload, cancel, onSaved } = props;
  const snapshot = useEditSnapshot(group);
  const update = useUpdatePermissionGroupMutation();
  const form = useForm<z.input<typeof featuresSchema>>({
    resolver: zodResolver(featuresSchema, { error: validationMessage }),
    defaultValues: { features: group.features, reason: "" },
  });
  return (
    <Form
      form={form}
      readOnly={readOnly}
      cancel={cancel}
      submitLabel="Lưu quyền"
      compareFields={[
        {
          name: "features",
          label: "Quyền",
          options: features.map((f) => ({ value: f.code, label: f.name })),
        },
      ]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async ({ reason, ...values }) => {
        await update.mutateAsync({
          groupId: group.id,
          version: snapshot.base.version,
          payload: { ...values, ...(reason ? { reason } : {}) },
        });
        toast.success("Đã lưu quyền của nhóm.");
        onSaved();
      }}
    >
      <Controller
        name="features"
        control={form.control}
        render={({ field }) => (
          <div className="col-span-12 min-w-0">
            <FeatureChecklist
              features={features}
              value={field.value}
              onChange={field.onChange}
              disabled={readOnly}
            />
          </div>
        )}
      />
      {!readOnly && (
        <FormTextarea
          label="Lý do"
          {...form.register("reason")}
          error={form.formState.errors.reason}
        />
      )}
    </Form>
  );
}

function GroupMembersForm({
  people,
  ...props
}: TabProps & { people: FormOption[] }) {
  const { group, readOnly, reload, cancel, onSaved } = props;
  const snapshot = useEditSnapshot(group);
  const replace = useReplacePermissionGroupMembersMutation();
  const form = useForm<z.input<typeof permissionGroupMembersSchema>>({
    resolver: zodResolver(permissionGroupMembersSchema, {
      error: validationMessage,
    }),
    defaultValues: { memberIds: group.memberIds, reason: "" },
  });
  return (
    <Form
      form={form}
      readOnly={readOnly}
      cancel={cancel}
      submitLabel="Lưu thành viên"
      compareFields={[
        { name: "memberIds", label: "Thành viên", options: people },
      ]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async ({ reason, memberIds }) => {
        await replace.mutateAsync({
          groupId: group.id,
          version: snapshot.base.version,
          payload: { memberIds, ...(reason ? { reason } : {}) },
        });
        toast.success("Đã cập nhật thành viên nhóm quyền.");
        onSaved();
      }}
    >
      <Controller
        name="memberIds"
        control={form.control}
        render={({ field }) => (
          <FormMultiSelect
            label="Thành viên"
            options={people}
            {...field}
            error={form.formState.errors.memberIds}
          />
        )}
      />
      {readOnly && (
        <p className="col-span-12 m-0 text-xs text-fg-subtle">
          {group.members.map((m) => m.label).join(", ") || "Chưa có thành viên"}
        </p>
      )}
      {!readOnly && (
        <FormTextarea
          label="Lý do"
          {...form.register("reason")}
          error={form.formState.errors.reason}
        />
      )}
    </Form>
  );
}

function GroupStatusForm({
  group,
  reload,
  onDone,
}: {
  group: PermissionGroupDto;
  reload: Reload;
  onDone: () => void;
}) {
  const snapshot = useEditSnapshot(group);
  const status = useSetPermissionGroupStatusMutation();
  const active = snapshot.base.status === "ACTIVE";
  return (
    <>
      <p className="text-fg-subtle">
        {active
          ? "Thành viên sẽ mất các quyền đến từ nhóm này."
          : "Thành viên sẽ nhận lại các quyền của nhóm."}
      </p>
      <ReasonForm
        submitLabel={active ? "Ngừng sử dụng" : "Kích hoạt"}
        cancel={
          <Button type="button" onClick={onDone}>
            Hủy
          </Button>
        }
        compareFields={[{ name: "status", label: "Trạng thái" }]}
        onConflictReload={() => snapshot.load(reload)}
        onConflictAccept={snapshot.accept}
        onSubmit={async (payload) => {
          await status.mutateAsync({
            groupId: group.id,
            payload,
            version: snapshot.base.version,
            active: !active,
          });
          toast.success("Đã cập nhật trạng thái nhóm quyền.");
          onDone();
        }}
      />
    </>
  );
}
