"use client";

import type { AuditDto } from "@/types/common";
import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { dateTime, eventLabel } from "@/lib/format";
import { AuditChanges } from "./audit-changes";
import { DataTable } from "./page";
import { UserBadge } from "./user-badge";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function HistoryTable({
  title,
  items,
  pagination,
  headerActions,
}: {
  title: string;
  items: AuditDto[];
  pagination?: ComponentProps<typeof DataTable>["pagination"];
  headerActions?: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = items.find((item) => item.id === selectedId);
  const detailId = useId();
  return (
    <div>
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
          eventLabel(item.action),
          <button
            key="detail"
            type="button"
            className="link-button"
            aria-label={`Xem thay đổi: ${eventLabel(item.action)}`}
            aria-expanded={open && selectedId === item.id}
            aria-controls={detailId}
            aria-haspopup="dialog"
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setSelectedId(item.id);
              setOpen(true);
            }}
          >
            Chi tiết
          </button>,
        ])}
      />
      <Dialog.Root open={open && Boolean(selected)} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay history-overlay" />
          <Dialog.Content
            id={detailId}
            className="drawer-content"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <div className="dialog-heading">
              <Dialog.Title>Chi tiết thay đổi</Dialog.Title>
              <Dialog.Close
                className="icon-button"
                aria-label="Đóng chi tiết lịch sử"
              >
                <X size={18} />
              </Dialog.Close>
            </div>
            {selected && (
              <>
                <h3 className="section-gap">{eventLabel(selected.action)}</h3>
                <div className="history-detail-meta">
                  <UserBadge name={selected.actor.displayName} />
                  <time className="small muted" dateTime={selected.at}>
                    {dateTime(selected.at)}
                  </time>
                </div>
                {selected.reason && (
                  <p className="preserve-lines small">{selected.reason}</p>
                )}
                <AuditChanges before={selected.before} after={selected.after} />
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
