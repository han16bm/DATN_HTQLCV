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
import { DataTable } from "@/components/patterns/data-table";
import { ModalHeader, drawerClass, overlayClass } from "./overlay";
import { UserBadge } from "./user-badge";
import * as Dialog from "@radix-ui/react-dialog";

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
  const trigger = useRef<HTMLButtonElement>(null);
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
            className="min-h-7 rounded-sm px-1.5 text-sm font-medium text-selected-fg hover:bg-hover"
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
          <Dialog.Overlay className={overlayClass("dialog", true)} />
          <Dialog.Content
            id={detailId}
            className={drawerClass}
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <ModalHeader
              compact
              title="Chi tiết thay đổi"
              closeLabel="Đóng chi tiết lịch sử"
            />
            {selected && (
              <>
                <h3 className="mt-2 mb-0 text-sm font-semibold text-fg">
                  {eventLabel(selected.action)}
                </h3>
                <div className="my-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <UserBadge name={selected.actor.displayName} />
                  <time
                    className="text-xs text-fg-subtle"
                    dateTime={selected.at}
                  >
                    {dateTime(selected.at)}
                  </time>
                </div>
                {selected.reason && (
                  <p className="text-xs whitespace-pre-wrap">
                    {selected.reason}
                  </p>
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
