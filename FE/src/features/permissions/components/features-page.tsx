"use client";

import { ReasonForm } from "@/components/forms/reason-form";
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
import { confirmDiscard } from "@/lib/forms/confirm-discard";
import { useEditSnapshot } from "@/lib/forms/use-edit-snapshot";
import { useEntityDialog } from "@/lib/forms/use-entity-dialog";
import Link from "next/link";
import { toast } from "sonner";
import { useUpdateFeatureMutation } from "../hooks/use-permissions-mutations";
import { useListFeaturesQuery } from "../hooks/use-permissions-queries";
import type { FeatureDto } from "../types/permissions.types";
import { FeatureName, featureTree } from "./feature-tree";

// BE từ chối tắt PERMISSIONS_MANAGE (422) vì không ai bật lại được qua giao diện.
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
              <span className="small muted"> — {feature.description}</span>
            )}
          </span>,
          feature.path ?? "—",
          feature.isGroup ? (
            "Nhóm"
          ) : (
            <Badge
              key="status"
              value={feature.isActive ? "ACTIVE" : "INACTIVE"}
            />
          ),
          feature.isGroup
            ? ""
            : stampText(feature.updatedBy, feature.updatedAt),
          feature.isGroup ? null : (
            <span key="actions" className="row-actions">
              <RowDialogLinks
                name={`mã ${feature.code}`}
                view={dialog.href("view", feature.code)}
              />
              {locked(feature) ? (
                <span className="muted" title={lockedReason}>
                  Tắt
                </span>
              ) : (
                <Link
                  className="detail-link"
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
              <fieldset className="form-fields" disabled>
                <div className="form-field field-medium">
                  <label htmlFor="feature-code">Mã quyền</label>
                  <input id="feature-code" value={selected.code} readOnly />
                </div>
                <div className="form-field field-medium">
                  <label htmlFor="feature-parent">Nhóm</label>
                  <input
                    id="feature-parent"
                    readOnly
                    value={
                      query.data.find((f) => f.code === selected.parentCode)
                        ?.name ?? "—"
                    }
                  />
                </div>
                <div className="form-field field-full">
                  <label htmlFor="feature-description">Mô tả</label>
                  <textarea
                    id="feature-description"
                    rows={2}
                    readOnly
                    value={selected.description ?? ""}
                  />
                </div>
                <div className="form-field field-medium">
                  <label htmlFor="feature-path">Đường dẫn</label>
                  <input
                    id="feature-path"
                    readOnly
                    value={selected.path ?? "—"}
                  />
                </div>
              </fieldset>
              <DialogFooter>
                <button type="button" onClick={dialog.close}>
                  Đóng
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={locked(selected)}
                  title={locked(selected) ? lockedReason : undefined}
                  onClick={() => dialog.switchTo("edit", selected.code)}
                >
                  {selected.isActive ? "Tắt mã quyền" : "Bật mã quyền"}
                </button>
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
      <p className="muted">
        {snapshot.base.isActive
          ? "Mọi tài khoản đang có mã này sẽ mất quyền ngay ở lần gọi tiếp theo."
          : "Mã này sẽ có hiệu lực lại với các nhóm và tài khoản đang được cấp."}
      </p>
      <ReasonForm
        submitLabel={snapshot.base.isActive ? "Tắt mã quyền" : "Bật mã quyền"}
        cancel={
          <button type="button" onClick={onCancel}>
            Hủy
          </button>
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
