"use client";
import { dateTime, hours, label, number } from "@/lib/format";
import type { AuditDto } from "@/types/common";

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
  displayName: "Họ tên",
  username: "Tên đăng nhập",
  email: "Email",
  gender: "Giới tính",
  birthDate: "Ngày sinh",
  phone: "Số điện thoại",
  permanentAddress: "Địa chỉ thường trú",
  temporaryAddress: "Địa chỉ tạm trú",
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
  if (field === "startDate" || field === "workDate" || field === "birthDate")
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(value));
  return label(value);
}
export function AuditChanges({
  before,
  after,
}: Pick<AuditDto, "before" | "after">) {
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
      <span className="text-xs text-fg-subtle">
        Không có thay đổi trường dữ liệu.
      </span>
    );
  return (
    <dl className="m-0 grid gap-3">
      {keys.map((key) => (
        <div
          key={key}
          className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md border border-line bg-surface p-3"
        >
          <dt className="col-span-full text-sm font-medium text-fg">
            {fields[key] ?? key}
          </dt>
          <dd className="m-0 min-w-0 text-left text-sm break-words whitespace-pre-wrap text-fg">
            <span className="block text-xs text-fg-subtle">Trước</span>
            {valueText(previous[key], key)}
          </dd>
          <dd className="m-0 min-w-0 text-left text-sm break-words whitespace-pre-wrap text-fg">
            <span className="block text-xs text-fg-subtle">Sau</span>
            {valueText(next[key], key)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
