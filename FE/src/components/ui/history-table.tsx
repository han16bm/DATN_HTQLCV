import type { AuditDto } from "@/types/common";
import type { ComponentProps, ReactNode } from "react";
import { dateTime, eventLabel } from "@/lib/format";
import { AuditChanges } from "./audit-changes";
import { DataTable } from "./page";

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
  return (
    <DataTable
      title={title}
      headerActions={headerActions}
      pagination={pagination}
      actions
      headers={["Thời điểm", "Người thực hiện", "Sự kiện", "Hành động"]}
      rows={items.map((item) => [
        dateTime(item.at),
        item.actor.displayName,
        <div key="event">
          {eventLabel(item.action)}
          {item.reason && <p className="small muted">{item.reason}</p>}
        </div>,
        <AuditChanges key="changes" before={item.before} after={item.after} />,
      ])}
    />
  );
}
