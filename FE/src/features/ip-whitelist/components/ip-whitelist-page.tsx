"use client";
import { cn } from "@/lib/cn";
import { DataTable } from "@/components/patterns/data-table";
import { IpAccessLogsPanel } from "./ip-access-logs-panel";
import { StatusLozenge } from "@/components/ui/lozenge";
import { Button } from "@/components/ui/button";

import { RecordStamp, stampText } from "@/components/ui/record-stamp";
import { Form } from "@/components/forms/form";
import { FormInput, FormTextarea } from "@/components/forms/form-field";
import { ReasonForm } from "@/components/forms/reason-form";
import { ActionButton } from "@/components/ui/action-button";
import { HashDialog } from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/ui/loading";
import {
  DialogFooter,
  EntityDialog,
  RowDialogLinks,
} from "@/components/ui/entity-dialog";
import { PageHeader, StatusField } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { useUpdateSettingMutation } from "@/features/settings/hooks/use-settings-mutations";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import {
  type DialogMode,
  useEntityDialog,
} from "@/lib/forms/use-entity-dialog";
import { useHashDialog } from "@/lib/forms/use-hash-dialog";
import { validationMessage } from "@/lib/forms/validation-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  useCreateIpWhitelistEntryMutation,
  useDeleteIpWhitelistEntryMutation,
  useUpdateIpWhitelistEntryMutation,
} from "../hooks/use-ip-whitelist-mutations";
import { useGetIpWhitelistQuery } from "../hooks/use-ip-whitelist-queries";
import {
  createIpWhitelistEntrySchema,
  updateIpWhitelistEntrySchema,
} from "../schemas/ip-whitelist.schema";
import type {
  IpWhitelistDto,
  IpWhitelistEntryDto,
} from "../types/ip-whitelist.types";

export function IpWhitelistPage() {
  const query = useGetIpWhitelistQuery();
  const dialog = useHashDialog();
  const entryDialog = useEntityDialog();
  const update = useUpdateIpWhitelistEntryMutation();
  const toggle = useUpdateSettingMutation();
  const snapshot = useEditSnapshot<IpWhitelistDto | undefined>(query.data);
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton variant="table" />;
  const data = query.data;
  const entry = (prefix: string) =>
    data.entries.find((e) => dialog.name === `${prefix}-${e.id}`);
  const selected = data.entries.find((e) => e.id === entryDialog.id);
  const deleting = entry("ip-delete");
  const reloadEntry =
    (id: string) => async (): Promise<{ data?: IpWhitelistEntryDto }> => ({
      data: (await query.refetch()).data?.entries.find((e) => e.id === id),
    });
  return (
    <>
      <PageHeader
        title="IP whitelist khu quản trị"
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => entryDialog.open("create")}
          >
            Thêm địa chỉ
          </Button>
        }
      />
      <section
        className={cn(
          "mb-5 grid gap-1 rounded-lg border px-4 py-3 text-sm [&_h2]:m-0 [&_h2]:text-sm [&_h2]:font-semibold [&_p]:m-0",
          data.enabled
            ? "border-success-fg/25 bg-success-bg"
            : "border-warning-fg/25 bg-warning-bg",
        )}
        aria-label="Trạng thái IP whitelist"
      >
        <h2>IP whitelist đang {data.enabled ? "bật" : "tắt"}</h2>
        <p>
          IP hiện tại của bạn: <code>{data.currentIp}</code>.{" "}
          {data.enabled
            ? "Chỉ các địa chỉ trong danh sách đang hoạt động mới vào được khu quản trị."
            : "Mọi địa chỉ IP đều vào được khu quản trị."}
        </p>
        <div className="actions mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => {
              snapshot.saved(data);
              dialog.open("ip-toggle");
            }}
          >
            {data.enabled ? "Tắt whitelist" : "Bật whitelist"}
          </Button>
        </div>
      </section>
      <DataTable
        title="Danh sách địa chỉ"
        actions
        widths={[16, 20, 10, 17, 17, 20]}
        headers={[
          "IP / CIDR",
          "Mô tả",
          "Trạng thái",
          "Thêm bởi",
          "Cập nhật bởi",
          "Hành động",
        ]}
        rows={data.entries.map((item) => [
          <code key="cidr">{item.cidr}</code>,
          item.description ?? "—",
          <StatusLozenge
            key="status"
            value={item.isActive ? "ACTIVE" : "INACTIVE"}
          />,
          stampText(item.createdBy, item.createdAt),
          stampText(item.updatedBy, item.updatedAt),
          <div
            key="actions"
            className="actions flex flex-wrap items-center gap-2"
          >
            <RowDialogLinks
              name={`địa chỉ ${item.cidr}`}
              view={entryDialog.href("view", item.id)}
              edit={entryDialog.href("edit", item.id)}
            />
            <ActionButton
              onAction={async () => {
                await update.mutateAsync({
                  entryId: item.id,
                  version: item.version,
                  payload: { isActive: !item.isActive },
                });
                toast.success("Đã cập nhật địa chỉ IP.");
              }}
            >
              {item.isActive ? "Tắt" : "Bật"}
            </ActionButton>
            <Button
              type="button"
              variant="subtle"
              onClick={() => dialog.open(`ip-delete-${item.id}`)}
            >
              Xóa
            </Button>
          </div>,
        ])}
      />
      <HashDialog
        name="ip-toggle"
        title={data.enabled ? "Tắt IP whitelist" : "Bật IP whitelist"}
        description={`IP hiện tại của bạn: ${data.currentIp}.`}
      >
        <ReasonForm
          submitLabel={data.enabled ? "Tắt whitelist" : "Bật whitelist"}
          compareFields={[{ name: "enabled", label: "Đang bật" }]}
          onConflictReload={async () => {
            const latest = await snapshot.load(() => query.refetch());
            return latest ?? {};
          }}
          onConflictAccept={snapshot.accept}
          onSubmit={async ({ reason }) => {
            const base = snapshot.base ?? data;
            await toggle.mutateAsync({
              settingId: base.settingId,
              version: base.settingVersion,
              payload: { value: base.enabled ? "false" : "true", reason },
            });
            toast.success("Đã cập nhật IP whitelist.");
            dialog.close();
          }}
        />
      </HashDialog>
      {entryDialog.mode && (entryDialog.mode === "create" || selected) && (
        <EntityDialog
          open
          title={
            entryDialog.mode === "create"
              ? "Thêm địa chỉ"
              : entryDialog.mode === "edit"
                ? `Sửa ${selected!.cidr}`
                : selected!.cidr
          }
          status={
            selected && (
              <StatusField value={selected.isActive ? "ACTIVE" : "INACTIVE"} />
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
          onClose={entryDialog.close}
        >
          <EntryForm
            key={`${entryDialog.mode}:${entryDialog.id}`}
            mode={entryDialog.mode}
            entry={selected}
            currentIp={data.currentIp}
            reload={selected ? reloadEntry(selected.id) : undefined}
            onSaved={(id) => entryDialog.switchTo("view", id)}
            onCancel={async () => {
              if (!(await confirmDiscard())) return;
              if (entryDialog.mode === "edit")
                entryDialog.switchTo("view", entryDialog.id);
              else entryDialog.close();
            }}
            onEdit={() => entryDialog.switchTo("edit", entryDialog.id)}
            onClose={entryDialog.close}
          />
        </EntityDialog>
      )}
      {deleting && (
        <HashDialog
          name={`ip-delete-${deleting.id}`}
          title={`Xóa ${deleting.cidr}`}
          description="Địa chỉ này sẽ bị xóa khỏi danh sách."
        >
          <DeleteEntry entry={deleting} onDone={dialog.close} />
        </HashDialog>
      )}
      <IpAccessLogsPanel />
    </>
  );
}

const editSchema = updateIpWhitelistEntrySchema
  .pick({ cidr: true, description: true, reason: true })
  .required({ cidr: true });
function EntryForm({
  mode,
  entry,
  currentIp,
  reload,
  onSaved,
  onCancel,
  onEdit,
  onClose,
}: {
  mode: DialogMode;
  entry?: IpWhitelistEntryDto;
  currentIp: string;
  reload?: () => Promise<{ data?: IpWhitelistEntryDto }>;
  onSaved: (id: string) => void;
  onCancel: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const snapshot = useEditSnapshot(entry);
  const create = useCreateIpWhitelistEntryMutation();
  const update = useUpdateIpWhitelistEntryMutation();
  const editing = mode === "edit" && entry;
  const schema = editing ? editSchema : createIpWhitelistEntrySchema;
  type Values = z.input<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver<Values, unknown, Values>(schema, {
      error: validationMessage,
    }),
    defaultValues: {
      cidr: entry?.cidr ?? "",
      description: entry?.description ?? "",
      ...(editing ? { reason: "" } : {}),
    },
  });
  const { errors } = form.formState;
  return (
    <>
      <Form
        form={form}
        readOnly={mode === "view"}
        submitLabel={editing ? "Lưu địa chỉ" : "Thêm vào danh sách"}
        cancel={
          <Button type="button" onClick={onCancel}>
            Hủy
          </Button>
        }
        compareFields={[
          { name: "cidr", label: "IP hoặc CIDR" },
          { name: "description", label: "Mô tả" },
        ]}
        onConflictReload={reload ? () => snapshot.load(reload) : undefined}
        onConflictAccept={snapshot.accept}
        onSubmit={async (values) => {
          const description = values.description || null;
          if (editing) {
            const reason = "reason" in values ? values.reason : undefined;
            await update.mutateAsync({
              entryId: entry.id,
              version: snapshot.base!.version,
              payload: {
                cidr: values.cidr,
                description,
                ...(reason ? { reason } : {}),
              },
            });
            toast.success("Đã lưu địa chỉ IP.");
            onSaved(entry.id);
          } else {
            const created = await create.mutateAsync({
              cidr: values.cidr,
              description,
            });
            toast.success("Đã thêm địa chỉ IP.");
            onSaved(created.id);
          }
        }}
      >
        <FormInput
          label="IP hoặc CIDR"
          required
          placeholder="203.113.1.5 hoặc 10.0.0.0/24"
          {...form.register("cidr")}
          error={errors.cidr}
        />
        {mode !== "view" && (
          <div className="col-span-12 min-w-0 @min-[26.25rem]/form:col-span-6 @min-[37.5rem]/form:col-span-4">
            <span className="mb-1.5 block text-sm font-medium text-fg">
              IP hiện tại: {currentIp}
            </span>
            <Button
              type="button"
              onClick={() =>
                form.setValue("cidr", currentIp, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              Thêm IP hiện tại
            </Button>
          </div>
        )}
        <FormInput
          label="Mô tả"
          width="long"
          {...form.register("description")}
          error={errors.description}
        />
        {editing && (
          <FormTextarea
            label="Lý do"
            {...form.register("reason")}
            error={form.getFieldState("reason", form.formState).error}
          />
        )}
      </Form>
      {mode === "view" && entry && (
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Đóng
          </Button>
          <Button type="button" variant="primary" onClick={onEdit}>
            Chỉnh sửa
          </Button>
        </DialogFooter>
      )}
    </>
  );
}

function DeleteEntry({
  entry,
  onDone,
}: {
  entry: IpWhitelistEntryDto;
  onDone: () => void;
}) {
  const remove = useDeleteIpWhitelistEntryMutation();
  return (
    <div className="actions flex flex-wrap items-center gap-2">
      <Button type="button" onClick={onDone}>
        Hủy
      </Button>
      <ActionButton
        primary
        pendingLabel="Đang xóa…"
        onAction={async () => {
          await remove.mutateAsync({
            entryId: entry.id,
            version: entry.version,
          });
          toast.success("Đã xóa địa chỉ IP.");
          onDone();
        }}
      >
        Xóa địa chỉ
      </ActionButton>
    </div>
  );
}
