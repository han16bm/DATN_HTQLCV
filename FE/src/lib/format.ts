const labels: Record<string, string> = {
  EMPLOYEE: "Nhân viên",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
  OWNER: "Phụ trách",
  MEMBER: "Thành viên",
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngừng sử dụng",
  LOCKED: "Đã khóa",
  NEW: "Mới tạo",
  TODO: "Chờ thực hiện",
  IN_PROGRESS: "Đang thực hiện",
  PENDING_REVIEW: "Chờ nghiệm thu",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  PLANNED: "Dự kiến",
  NORMAL: "Bình thường",
  LOW: "Thấp",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
  PENDING: "Chờ xét",
  ACCEPTED: "Đã chấp nhận",
  REVISION_REQUESTED: "Yêu cầu chỉnh sửa",
  DAILY: "Hằng ngày",
  WEEKLY: "Hằng tuần",
  DRAFT: "Bản nháp",
  SUBMITTED: "Đã gửi",
  VOID: "Đã loại",
  READ: "Đã đọc",
  UNREAD: "Chưa đọc",
  RESOLVED: "Đã xử lý",
  DISMISSED: "Đã bác bỏ",
  CONFIRMED: "Xác nhận",
  REJECTED: "Bác bỏ",
  SUFFICIENT: "Đủ dữ liệu",
  PARTIAL: "Thiếu một phần",
  INSUFFICIENT: "Chưa đủ dữ liệu",
  READY: "Đã phân tích",
  NOT_REQUESTED: "Chưa yêu cầu",
  QUEUED: "Đang chờ",
  RUNNING: "Đang phân tích",
  FAILED: "Phân tích lỗi",
  UNAVAILABLE: "Chưa sẵn sàng",
  SUCCEEDED: "Đã hoàn tất",
  CURRENT: "Hiện hành",
  OUTDATED: "Dữ liệu đã cũ",
  OVERDUE: "Quá hạn",
  AT_RISK: "Có nguy cơ",
  INSUFFICIENT_DATA: "Chưa đủ dữ liệu",
  NO_SIGNAL: "Chưa có dấu hiệu",
  UNKNOWN: "Chưa xác định",
  MEDIUM: "Trung bình",
  CRITICAL: "Nghiêm trọng",
  INFO: "Thông tin",
  DEADLINE_RISK: "Nguy cơ trễ hạn",
  WORKLOAD: "Khối lượng công việc",
  BOTTLENECK: "Điểm nghẽn quy trình",
  DATA_QUALITY: "Chất lượng dữ liệu",
  PROJECT_MANAGE: "Quản lý dự án",
  PROJECT_CREATE: "Tạo dự án",
  MEMBERS_MANAGE: "Quản lý thành viên",
  TASKS_MANAGE: "Quản lý công việc",
  TASKS_REVIEW: "Nghiệm thu công việc",
  ANALYTICS_VIEW: "Xem phân tích",
  ALERTS_MANAGE: "Xử lý cảnh báo",
  USERS_MANAGE: "Quản lý tài khoản",
  ORGANIZATION_MANAGE: "Quản lý tổ chức",
};
export const label = (value: string) => labels[value] ?? value;
export const eventLabel = (value: string) =>
  value.split(" → ").map(label).join(" → ");
export const dateTime = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date(value))
    : "—";
export const number = (value: number | null | undefined, suffix = "") =>
  value === null || value === undefined
    ? "Chưa đủ dữ liệu"
    : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
        value,
      ) + (suffix ? ` ${suffix}` : "");
export const hours = (minutes: number) => number(minutes / 60, "giờ");
const metricUnits: Record<string, string> = {
  TASK: "việc",
  COUNT: "lần",
  PERCENT: "%",
  MINUTE: "phút",
  HOUR: "giờ",
  REPORT: "báo cáo",
};
export const metricValue = (value: number | null, unit: string) =>
  number(value, metricUnits[unit] ?? unit);
export function fileSize(bytes: number) {
  const step = bytes >= 1024 ** 2 ? 2 : bytes >= 1024 ? 1 : 0;
  return number(bytes / 1024 ** step, ["B", "KiB", "MiB"][step]);
}
export const localDateTime = (value: string) =>
  new Date(Date.parse(value) + 7 * 3600_000).toISOString().slice(0, 16);
export function utcDateTime(value: string) {
  const time = new Date(`${value}+07:00`);
  return Number.isFinite(time.getTime()) ? time.toISOString() : value;
}
export const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: label(value) }));
export function changedFields<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  original: Record<string, unknown>,
  next: T,
  allowed: readonly K[],
): Partial<Pick<T, K>> {
  const patch: Partial<Pick<T, K>> = {};
  for (const key of allowed)
    if (JSON.stringify(original[String(key)]) !== JSON.stringify(next[key]))
      patch[key] = next[key];
  return patch;
}
