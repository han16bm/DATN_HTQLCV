"use client";
import { dateTime, hours, label, number } from "@/lib/format";
import type { AuditDto } from "@/types/common";
import * as Popover from "@radix-ui/react-popover";
import { X } from "lucide-react";

const fields: Record<string, string> = {
  title: "Tên công việc",
  name: "Tên dự án",
  code: "Mã dự án",
  objective: "Mục tiêu",
  description: "Mô tả",
  acceptanceCriteria: "Tiêu chí nghiệm thu",
  status: "Trạng thái",
  priority: "Ưu tiên",
  startDate: "Ngày bắt đầu",
  dueAt: "Hạn hoàn thành",
  endedAt: "Kết thúc tư cách",
  workDate: "Ngày làm việc",
  estimatedMinutes: "Thời gian dự kiến",
  remainingMinutes: "Thời gian còn lại",
  minutes: "Giờ công",
  user: "Thành viên",
  owner: "Người phụ trách",
  assignee: "Người thực hiện",
  projectRole: "Vai trò dự án",
};
type Value = AuditDto["before"];
function valueText(value: Value | undefined, field: string): string {
  if (value === null || value === undefined || value === "") return "Chưa có";
  if (Array.isArray(value))
    return value.length
      ? value.map((item) => valueText(item, field)).join(", ")
      : "Không có";
  if (typeof value === "object") {
    if (typeof value.displayName === "string") return value.displayName;
    return Object.entries(value)
      .map(([key, item]) => `${fields[key] ?? key}: ${valueText(item, key)}`)
      .join("; ");
  }
  if (typeof value === "number")
    return field.toLowerCase().includes("minutes")
      ? hours(value)
      : number(value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (field.endsWith("At")) return dateTime(value);
  if (field === "startDate" || field === "workDate")
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(value));
  return label(value);
}
export function AuditChanges({
  before,
  after,
  inline = false,
}: Pick<AuditDto, "before" | "after"> & { inline?: boolean }) {
  const previous =
    before && typeof before === "object" && !Array.isArray(before)
      ? before
      : {};
  const next =
    after && typeof after === "object" && !Array.isArray(after) ? after : {};
  const keys = Object.keys(next).filter(
    (key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]),
  );
  if (!keys.length)
    return (
      <span className="muted small">Không có thay đổi trường dữ liệu.</span>
    );
  const content = (
    <dl>
      {keys.map((key) => (
        <div key={key}>
          <dt>{fields[key] ?? key}</dt>
          <dd>
            <span className="small muted">Trước</span>
            {valueText(previous[key], key)}
          </dd>
          <dd>
            <span className="small muted">Sau</span>
            {valueText(next[key], key)}
          </dd>
        </div>
      ))}
    </dl>
  );
  if (inline) return <div className="audit-changes">{content}</div>;
  return (
    <Popover.Root>
      <Popover.Trigger className="link-button">
        Xem thay đổi ({keys.length})
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="audit-changes audit-popover"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          aria-label="Nội dung thay đổi"
        >
          <div className="panel-heading">
            <h3>Nội dung thay đổi</h3>
            <Popover.Close className="icon-button" aria-label="Đóng thay đổi">
              <X size={16} />
            </Popover.Close>
          </div>
          {content}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
