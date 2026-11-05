"use client";
import { DataTable } from "@/components/patterns/data-table";
import { StatusLozenge } from "@/components/ui/lozenge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ReasonForm } from "@/components/forms/reason-form";
import {
  DialogFooter,
  EntityDialog,
  RowDialogLinks,
} from "@/components/ui/entity-dialog";
import { PageSkeleton } from "@/components/ui/loading";
import { PageHeader, StatusField } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { RecordStamp, stampText } from "@/components/ui/record-stamp";
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import Link from "next/link";
import { toast } from "sonner";
import { useUpdateFeatureMutation } from "../hooks/use-permissions-mutations";
import { useListFeaturesQuery } from "../hooks/use-permissions-queries";
import type { FeatureDto } from "../types/permissions.types";
import { FeatureName, featureTree } from "./feature-tree";

const locked = (feature: FeatureDto) =>
  feature.code === "PERMISSIONS_MANAGE" && feature.isActive;
const lockedReason =
  "Không thể tắt mã quản lý phân quyền: tắt mã này rút quyền của mọi người, kể cả quản trị tối cao, và không ai bật lại được qua giao diện.";

export function FeaturesPage() {
  const query = useListFeaturesQuery();
  const dialog = useEntityDialog();
  if (query.isError)
    return <QueryErrorState error={query.error} retry={query.refetch} />;
  if (!query.data) return <PageSkeleton variant="table" />;
  const selected = query.data.find((feature) => feature.code === dialog.id);
  return (
    <>
      <PageHeader
        title="Danh mục chức năng"
        description="Mã quyền do hệ thống định nghĩa. Tắt một mã sẽ rút quyền đó khỏi mọi người, kể cả quản trị tối cao."
      />
      <DataTable
        title="Cây chức năng"
        actions
        widths={[40, 14, 12, 18, 16]}
        headers={[
          "Chức năng",
          "Đường dẫn",
          "Trạng thái",
          "Cập nhật bởi",
          "Hành động",
        ]}
        rows={featureTree(query.data).map(({ feature, depth }) => [
          <span key="name" style={{ paddingLeft: depth * 24 }}>
            <FeatureName feature={feature} />
            {feature.description && (
              <span className="text-xs text-fg-subtle">
                {" "}
                — {feature.description}
              </span>
            )}
          </span>,
          feature.path ?? "—",
          feature.isGroup ? (
            "Nhóm"
          ) : (
            <StatusLozenge
              key="status"
              value={feature.isActive ? "ACTIVE" : "INACTIVE"}
            />
          ),
          feature.isGroup
            ? ""
            : stampText(feature.updatedBy, feature.updatedAt),
          feature.isGroup ? null : (
            <span
              key="actions"
              className="actions inline-flex items-center gap-1"
            >
              <RowDialogLinks
                name={`mã ${feature.code}`}
                view={dialog.href("view", feature.code)}
              />
              {locked(feature) ? (
                <span className="text-fg-subtle" title={lockedReason}>
                  Tắt
                </span>
              ) : (
                <Link
                  className="inline-flex min-h-7 items-center rounded-sm px-1.5 text-sm font-medium whitespace-nowrap text-selected-fg transition-colors hover:bg-hover active:bg-pressed motion-reduce:transition-none pointer-coarse:min-h-11"
                  scroll={false}
                  href={dialog.href("edit", feature.code)}
                >
                  {feature.isActive ? "Tắt" : "Bật"}
                </Link>
              )}
            </span>
          ),
        ])}
      />
      {dialog.mode && selected && !selected.isGroup && (
        <EntityDialog
          open
          title={selected.name}
          status={
            <StatusField value={selected.isActive ? "ACTIVE" : "INACTIVE"} />
          }
          stamp={
            <RecordStamp
              updatedBy={selected.updatedBy}
              updatedAt={selected.updatedAt}
            />
          }
          onClose={dialog.close}
        >
          {dialog.mode === "edit" && !locked(selected) ? (
            <FeatureToggleForm
              key={selected.code}
              feature={selected}
              reload={async () => {
                const result = await query.refetch();
                return {
                  data: result.data?.find((f) => f.code === selected.code),
                };
              }}
              onCancel={async () => {
                if (await confirmDiscard())
                  dialog.switchTo("view", selected.code);
              }}
              onDone={() => dialog.switchTo("view", selected.code)}
            />
          ) : (
            <>
              <fieldset
                className="m-0 grid min-w-0 grid-cols-12 items-start gap-4 border-0 p-0"
                disabled
              >
                <div className="col-span-12 min-w-0 @min-[26.25rem]/form:col-span-6">
                  <label htmlFor="feature-code">Mã quyền</label>
                  <Input id="feature-code" value={selected.code} readOnly />
                </div>
                <div className="col-span-12 min-w-0 @min-[26.25rem]/form:col-span-6">
                  <label htmlFor="feature-parent">Nhóm</label>
                  <Input
                    id="feature-parent"
                    readOnly
                    value={
                      query.data.find((f) => f.code === selected.parentCode)
                        ?.name ?? "—"
                    }
                  />
                </div>
                <div className="col-span-12 min-w-0">
                  <label htmlFor="feature-description">Mô tả</label>
                  <Textarea
                    id="feature-description"
                    rows={2}
                    readOnly
                    value={selected.description ?? ""}
                  />
                </div>
                <div className="col-span-12 min-w-0 @min-[26.25rem]/form:col-span-6">
                  <label htmlFor="feature-path">Đường dẫn</label>
                  <Input
                    id="feature-path"
                    readOnly
                    value={selected.path ?? "—"}
                  />
                </div>
              </fieldset>
              <DialogFooter>
                <Button type="button" onClick={dialog.close}>
                  Đóng
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={locked(selected)}
                  title={locked(selected) ? lockedReason : undefined}
                  onClick={() => dialog.switchTo("edit", selected.code)}
                >
                  {selected.isActive ? "Tắt mã quyền" : "Bật mã quyền"}
                </Button>
              </DialogFooter>
            </>
          )}
        </EntityDialog>
      )}
    </>
  );
}

function FeatureToggleForm({
  feature,
  reload,
  onCancel,
  onDone,
}: {
  feature: FeatureDto;
  reload: () => Promise<{ data?: FeatureDto }>;
  onCancel: () => void;
  onDone: () => void;
}) {
  const snapshot = useEditSnapshot(feature);
  const mutation = useUpdateFeatureMutation();
  return (
    <>
      <p className="text-fg-subtle">
        {snapshot.base.isActive
          ? "Mọi tài khoản đang có mã này sẽ mất quyền ngay ở lần gọi tiếp theo."
          : "Mã này sẽ có hiệu lực lại với các nhóm và tài khoản đang được cấp."}
      </p>
      <ReasonForm
        submitLabel={snapshot.base.isActive ? "Tắt mã quyền" : "Bật mã quyền"}
        cancel={
          <Button type="button" onClick={onCancel}>
            Hủy
          </Button>
        }
        compareFields={[{ name: "isActive", label: "Đang bật" }]}
        onConflictReload={() => snapshot.load(reload)}
        onConflictAccept={snapshot.accept}
        onSubmit={async ({ reason }) => {
          await mutation.mutateAsync({
            code: feature.code,
            payload: { isActive: !snapshot.base.isActive, reason },
            version: snapshot.base.version,
          });
          toast.success("Đã cập nhật mã chức năng.");
          onDone();
        }}
      />
    </>
  );
}
