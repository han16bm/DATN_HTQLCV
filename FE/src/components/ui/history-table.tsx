"use client";

import type { AuditDto } from "@/types/common";
import {
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { dateTime, eventLabel } from "@/lib/format";
import { AuditChanges } from "./audit-changes";
import { DataTable } from "@/components/patterns/data-table";
import { detailClass } from "./page";
import { SlidePanel } from "./slide-panel";
import { UserBadge } from "./user-badge";

export function HistoryTable({
  title,
  items,
  pagination,
  headerActions,
  loading,
}: {
  title: string;
  items: AuditDto[];
  pagination?: ComponentProps<typeof DataTable>["pagination"];
  headerActions?: ReactNode;
  loading?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id === selectedId);
  const detailId = useId();
  return (
    <div>
      <DataTable
        loading={loading}
        widths={[21, 23, 38, 18]}
        title={title}
        headerActions={headerActions}
        pagination={pagination}
        actions
        headers={["Thời điểm", "Người thực hiện", "Sự kiện", "Hành động"]}
        rows={items.map((item) => [
          dateTime(item.at),
          <UserBadge key="actor" name={item.actor.displayName} />,
          eventLabel(item.action),
          <button
            key="detail"
            data-ui
            type="button"
            className={detailClass}
            aria-label={`Xem thay đổi: ${eventLabel(item.action)}`}
            aria-expanded={open && selectedId === item.id}
            aria-controls={detailId}
            aria-haspopup="dialog"
            onClick={() => {
              setSelectedId(item.id);
              setOpen(true);
            }}
          >
            Chi tiết
          </button>,
        ])}
      />
      <SlidePanel
        id={detailId}
        size="sm"
        open={open && Boolean(selected)}
        onOpenChange={setOpen}
        title="Chi tiết thay đổi"
        closeLabel="Đóng chi tiết lịch sử"
      >
        {selected && (
          <>
            <div className="grid gap-2 border-b border-line pb-3">
              <h3 className="m-0 text-sm font-semibold text-fg">
                {eventLabel(selected.action)}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <UserBadge name={selected.actor.displayName} />
                <time className="text-xs text-fg-subtle" dateTime={selected.at}>
                  {dateTime(selected.at)}
                </time>
              </div>
              {selected.reason && (
                <p className="m-0 text-xs break-words whitespace-pre-wrap text-fg-subtle">
                  {selected.reason}
                </p>
              )}
            </div>
            <AuditChanges before={selected.before} after={selected.after} />
          </>
        )}
      </SlidePanel>
    </div>
  );
}
