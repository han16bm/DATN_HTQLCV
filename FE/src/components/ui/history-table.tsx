"use client";

import type { AuditDto } from "@/types/common";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { dateTime, eventLabel } from "@/lib/format";
import { AuditChanges } from "./audit-changes";
import { DataTable } from "./page";
import { UserBadge } from "./user-badge";

export function HistoryTable({
  title,
  items,
  pagination,
  headerActions,
  split = false,
}: {
  title: string;
  items: AuditDto[];
  pagination?: ComponentProps<typeof DataTable>["pagination"];
  headerActions?: ReactNode;
  split?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId);
  const detailId = useId();
  return (
    <div className={split ? "history-layout" : undefined}>
      <DataTable
        widths={[21, 23, 38, 18]}
        title={title}
        headerActions={headerActions}
        pagination={pagination}
        actions
        headers={["Thời điểm", "Người thực hiện", "Sự kiện", "Hành động"]}
        rows={items.map((item) => [
          dateTime(item.at),
          <UserBadge key="actor" name={item.actor.displayName} />,
          <div key="event">
            {eventLabel(item.action)}
            {!split && item.reason && (
              <p className="small muted">{item.reason}</p>
            )}
          </div>,
          split ? (
            <button
              key="detail"
              type="button"
              className="link-button"
              aria-label={`Xem thay đổi: ${eventLabel(item.action)}`}
              aria-pressed={selected?.id === item.id}
              aria-controls={detailId}
              onClick={() => setSelectedId(item.id)}
            >
              Chi tiết
            </button>
          ) : (
            <AuditChanges
              key="changes"
              before={item.before}
              after={item.after}
            />
          ),
        ])}
      />
      {split && (
        <aside
          className="history-detail"
          id={detailId}
          aria-label="Chi tiết thay đổi"
        >
          <div className="panel-heading">
            <h3>
              {selected ? eventLabel(selected.action) : "Chi tiết lịch sử"}
            </h3>
          </div>
          <div className="panel-body card" tabIndex={0}>
            {selected ? (
              <>
                <div className="history-detail-meta">
                  <UserBadge name={selected.actor.displayName} />
                  <time className="small muted" dateTime={selected.at}>
                    {dateTime(selected.at)}
                  </time>
                </div>
                {selected.reason && (
                  <p className="preserve-lines small">{selected.reason}</p>
                )}
                <AuditChanges
                  inline
                  before={selected.before}
                  after={selected.after}
                />
              </>
            ) : (
              <p className="history-placeholder">
                {items.length
                  ? "Chọn Chi tiết ở một sự kiện để xem nội dung thay đổi."
                  : "Chưa có hoạt động để xem chi tiết."}
              </p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
