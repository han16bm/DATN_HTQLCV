"use client";

import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import { ReasonForm } from "@/components/forms/reason-form";
import { HashDialog } from "@/components/ui/dialog";
import {
  DialogFooter,
  EntityDialog,
  RowDialogLinks,
} from "@/components/ui/entity-dialog";
import { PageSkeleton } from "@/components/ui/loading";
import {
  Badge,
  DataTable,
  PageHeader,
  StatusField,
} from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { RecordStamp, stampText } from "@/components/ui/record-stamp";
import { changedFields } from "@/lib/format";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import {
  type DialogMode,
  useEntityDialog,
} from "@/lib/forms/use-entity-dialog";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { useUrlFilters } from "@/lib/query/use-url-filters";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useCreateSettingMutation,
  useUpdateSettingMutation,
} from "../hooks/use-settings-mutations";
import { useListSettingsQuery } from "../hooks/use-settings-queries";
import {
  configDataTypeSchema,
  createSettingSchema,
  serviceTypeSchema,
  updateSettingSchema,
} from "../schemas/setting.schema";
import type { SettingDto } from "../types/settings.types";

type Reload = () => Promise<{ data?: SettingDto }>;

export function SettingsPage() {
  const filter = useUrlFilters();
  const dialog = useEntityDialog();
  const toggle = useHashDialog();
  const serviceType = serviceTypeSchema.safeParse(filter.get("serviceType"));
  const query = useListSettingsQuery({
    serviceType: serviceType.success ? serviceType.data : undefined,
    group: filter.get("group") || undefined,
    q: filter.get("q") || undefined,
  });
  // Danh sách đầy đủ để dựng lựa chọn nhóm và tìm dòng đang mở trong dialog.
  const all = useListSettingsQuery();
  const groups = [...new Set(all.data?.map((s) => s.group))].sort();
  const reload =
    (id: string): Reload =>
    async () => ({
      data: (await all.refetch()).data?.find((s) => s.id === id),
    });
  const selected = all.data?.find((s) => s.id === dialog.id);
  const toggling = all.data?.find(
    (s) => toggle.name === `setting-status-${s.id}`,
  );
  return (
    <>
      <PageHeader
        title="Cấu hình tập trung"
        description="Cấu hình mọi service đọc từ cơ sở dữ liệu. Không lưu secret, chuỗi kết nối hay khóa ký ở đây."
        actions={
          <button
            type="button"
            className="primary"
            onClick={() => dialog.open("create")}
          >
            Thêm cấu hình
          </button>
        }
      />
      <section className="panel filters">
        <label>
          Tìm key
          <input
            type="search"
            placeholder="Ví dụ Auth:MaxFailedAttempts"
            value={filter.get("q")}
            onChange={(e) => filter.set("q", e.target.value)}
          />
        </label>
        <label>
          Service
          <select
            value={filter.get("serviceType")}
            onChange={(e) => filter.set("serviceType", e.target.value)}
          >
            <option value="">Tất cả</option>
            {serviceTypeSchema.options.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nhóm
          <select
            value={filter.get("group")}
            onChange={(e) => filter.set("group", e.target.value)}
          >
            <option value="">Tất cả</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
      </section>
      {query.isError ? (
        <QueryErrorState error={query.error} retry={query.refetch} />
      ) : !query.data ? (
        <PageSkeleton variant="table" />
      ) : !query.data.length ? (
        <DataTable headers={["Cấu hình"]} rows={[]} />
      ) : (
        [...new Set(query.data.map((s) => s.group))].map((group) => (
          <DataTable
            key={group}
            title={group}
            actions
            widths={[20, 11, 22, 12, 12, 12, 11]}
            headers={[
              "Key",
              "Service",
              "Tên",
              "Giá trị",
              "Trạng thái",
              "Cập nhật bởi",
              "Hành động",
            ]}
            rows={query
              .data!.filter((s) => s.group === group)
              .map((s) => [
                <code key="key">{s.key}</code>,
                s.serviceType,
                <span key="name">
                  {s.name}
                  {s.description && (
                    <span className="small muted"> — {s.description}</span>
                  )}
                </span>,
                <code key="value">{s.value}</code>,
                <span key="status" className="tag-list">
                  <Badge value={s.isActive ? "ACTIVE" : "INACTIVE"} />
                  {s.requiresRestart && (
                    <span className="badge">Cần khởi động lại</span>
                  )}
                  {!s.known && <span className="badge">Tuỳ biến</span>}
                </span>,
                <span
                  key="stamp"
                  className="small"
                  title={`Thêm bởi ${stampText(s.createdBy, s.createdAt)}`}
                >
                  {stampText(s.updatedBy, s.updatedAt)}
                </span>,
                <span key="actions" className="row-actions">
                  <RowDialogLinks
                    name={`cấu hình ${s.key}`}
                    view={dialog.href("view", s.id)}
                    edit={dialog.href("edit", s.id)}
                  />
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => toggle.open(`setting-status-${s.id}`)}
                  >
                    {s.isActive ? "Tắt" : "Bật"}
                  </button>
                </span>,
              ])}
          />
        ))
      )}
      {dialog.mode && (dialog.mode === "create" || selected) && (
        <EntityDialog
          open
          title={
            dialog.mode === "create"
              ? "Thêm cấu hình"
              : dialog.mode === "edit"
                ? `Sửa ${selected!.key}`
                : selected!.key
          }
          status={
            selected && (
              <>
                <StatusField
                  value={selected.isActive ? "ACTIVE" : "INACTIVE"}
                />
                {selected.requiresRestart && (
                  <span className="badge">Cần khởi động lại</span>
                )}
                {!selected.known && <span className="badge">Tuỳ biến</span>}
              </>
            )
          }
          stamp={
            selected && (
              <RecordStamp
                createdBy={selected.createdBy}
                createdAt={selected.createdAt}
                updatedBy={selected.updatedBy}
                updatedAt={selected.updatedAt}
              />
            )
          }
          onClose={dialog.close}
        >
          <SettingForm
            key={`${dialog.mode}:${dialog.id}`}
            mode={dialog.mode}
            setting={selected}
            reload={selected ? reload(selected.id) : undefined}
            onSaved={(id) => dialog.switchTo("view", id)}
            onCancel={async () => {
              if (!(await confirmDiscard())) return;
              if (dialog.mode === "edit") dialog.switchTo("view", dialog.id);
              else dialog.close();
            }}
            onEdit={() => dialog.switchTo("edit", dialog.id)}
            onClose={dialog.close}
          />
        </EntityDialog>
      )}
      {toggling && (
        <HashDialog
          name={`setting-status-${toggling.id}`}
          title={`${toggling.isActive ? "Tắt" : "Bật"} ${toggling.key}`}
          description={
            toggling.isActive
              ? "Service sẽ dùng giá trị trong file cấu hình thay cho dòng này."
              : "Service sẽ đọc lại giá trị của dòng này."
          }
        >
          <SettingStatusForm
            key={toggling.id}
            setting={toggling}
            reload={reload(toggling.id)}
            onDone={toggle.close}
          />
        </HashDialog>
      )}
    </>
  );
}

// Form chung cho Thêm/Xem/Sửa; ở chế độ Sửa key, service và kiểu dữ liệu bị khóa.
const formSchema = createSettingSchema.extend({
  reason: z.string().trim().max(2000).optional(),
});
// Trường bị khóa (disabled) không có trong giá trị gửi của RHF nên không bắt buộc.
const editSchema = formSchema
  .partial({ key: true, serviceType: true, group: true, dataType: true })
  .extend({ reason: updateSettingSchema.shape.reason });
function SettingForm({
  mode,
  setting,
  reload,
  onSaved,
  onCancel,
  onEdit,
  onClose,
}: {
  mode: DialogMode;
  setting?: SettingDto;
  reload?: Reload;
  onSaved: (id: string) => void;
  onCancel: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const snapshot = useEditSnapshot(setting);
  const create = useCreateSettingMutation();
  const update = useUpdateSettingMutation();
  const editing = mode === "edit" && setting;
  const schema = editing ? editSchema : formSchema;
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues: setting
      ? {
          key: setting.key,
          serviceType: setting.serviceType,
          group: setting.group,
          name: setting.name,
          description: setting.description ?? "",
          dataType: setting.dataType,
          value: setting.value,
          reason: "",
        }
      : {
          key: "",
          serviceType: "Global",
          group: "",
          name: "",
          description: "",
          dataType: "STRING",
          value: "",
        },
  });
  const { errors } = form.formState;
  const [watchedType, value] = useWatch({
    control: form.control,
    name: ["dataType", "value"],
  });
  const dataType = setting?.dataType ?? watchedType;
  const range =
    setting && (setting.minValue !== null || setting.maxValue !== null)
      ? `Từ ${setting.minValue ?? "—"} đến ${setting.maxValue ?? "—"}.`
      : undefined;
  const locked = Boolean(setting);
  return (
    <>
      <Form
        form={form}
        readOnly={mode === "view"}
        submitLabel={editing ? "Lưu cấu hình" : "Thêm cấu hình"}
        cancel={
          <button type="button" onClick={onCancel}>
            Hủy
          </button>
        }
        compareFields={[
          { name: "value", label: "Giá trị" },
          { name: "name", label: "Tên" },
          { name: "description", label: "Mô tả" },
        ]}
        onConflictReload={reload ? () => snapshot.load(reload) : undefined}
        onConflictAccept={snapshot.accept}
        onSubmit={async ({ reason, ...values }) => {
          if (editing) {
            const base = snapshot.base!;
            const patch = changedFields(
              {
                value: base.value,
                name: base.name,
                description: base.description ?? "",
              },
              values,
              ["value", "name", "description"],
            );
            await update.mutateAsync({
              settingId: base.id,
              version: base.version,
              payload: {
                ...patch,
                ...(patch.description === "" ? { description: null } : {}),
                reason: reason ?? "",
              },
            });
            toast.success("Đã lưu cấu hình.");
            onSaved(base.id);
          } else {
            // Nhánh tạo đã qua formSchema đầy đủ; parse lại để có kiểu payload tạo.
            const created = await create.mutateAsync(
              createSettingSchema.parse({
                ...values,
                description: values.description || null,
              }),
            );
            toast.success("Đã thêm cấu hình.");
            onSaved(created.id);
          }
        }}
      >
        <FormInput
          label="Key"
          required
          disabled={locked}
          hint={
            locked
              ? undefined
              : "Đường dẫn IConfiguration, ví dụ Features:BetaReports."
          }
          {...form.register("key")}
          error={errors.key}
        />
        <FormSelect
          label="Service"
          required
          disabled={locked}
          options={serviceTypeSchema.options.map((v) => ({
            value: v,
            label: v,
          }))}
          {...form.register("serviceType")}
          error={errors.serviceType}
        />
        <FormInput
          label="Nhóm"
          required
          width="short"
          disabled={locked}
          {...form.register("group")}
          error={errors.group}
        />
        <FormSelect
          label="Kiểu dữ liệu"
          required
          disabled={locked}
          options={configDataTypeSchema.options.map((v) => ({
            value: v,
            label: v,
          }))}
          {...form.register("dataType")}
          error={errors.dataType}
        />
        <FormInput
          label="Tên"
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
        {dataType === "BOOL" ? (
          <div className="form-field field-full">
            <label className="checkbox-label">
              <input
                type="checkbox"
                role="switch"
                checked={value === "true"}
                onChange={(e) =>
                  form.setValue("value", String(e.target.checked), {
                    shouldDirty: true,
                  })
                }
              />
              Bật
            </label>
            {errors.value && (
              <span className="field-error" role="alert">
                {errors.value.message}
              </span>
            )}
          </div>
        ) : setting?.allowedValues ? (
          <FormSelect
            label="Giá trị"
            required
            options={setting.allowedValues.map((v) => ({ value: v, label: v }))}
            {...form.register("value")}
            error={errors.value}
          />
        ) : (
          <FormInput
            label="Giá trị"
            type={dataType === "INT" ? "number" : "text"}
            min={setting?.minValue ?? undefined}
            max={setting?.maxValue ?? undefined}
            hint={range}
            {...form.register("value")}
            error={errors.value}
          />
        )}
        {setting?.requiresRestart && (
          <p className="small muted form-field field-full">
            Cần khởi động lại service để giá trị mới có hiệu lực.
          </p>
        )}
        {editing && (
          <FormTextarea
            label="Lý do"
            required
            {...form.register("reason")}
            error={errors.reason}
          />
        )}
      </Form>
      {mode === "view" && setting && (
        <DialogFooter>
          <button type="button" onClick={onClose}>
            Đóng
          </button>
          <button type="button" className="primary" onClick={onEdit}>
            Chỉnh sửa
          </button>
        </DialogFooter>
      )}
    </>
  );
}

function SettingStatusForm({
  setting,
  reload,
  onDone,
}: {
  setting: SettingDto;
  reload: Reload;
  onDone: () => void;
}) {
  const snapshot = useEditSnapshot(setting);
  const update = useUpdateSettingMutation();
  return (
    <ReasonForm
      submitLabel={snapshot.base.isActive ? "Tắt cấu hình" : "Bật cấu hình"}
      compareFields={[{ name: "isActive", label: "Đang bật" }]}
      onConflictReload={() => snapshot.load(reload)}
      onConflictAccept={snapshot.accept}
      onSubmit={async ({ reason }) => {
        await update.mutateAsync({
          settingId: setting.id,
          version: snapshot.base.version,
          payload: { isActive: !snapshot.base.isActive, reason },
        });
        toast.success("Đã cập nhật cấu hình.");
        onDone();
      }}
    />
  );
}
