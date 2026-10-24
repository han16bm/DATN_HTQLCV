export const labels: Record<string, string> = {
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
};
export const label = (value: string) => labels[value] ?? value;
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
export const localDateTime = (value: string) =>
  new Date(Date.parse(value) + 7 * 3600_000).toISOString().slice(0, 16);
export function utcDateTime(value: string) {
  const time = new Date(`${value}+07:00`);
  return Number.isFinite(time.getTime()) ? time.toISOString() : value;
}
export const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: label(value) }));
export function changedFields(
  original: Record<string, unknown>,
  next: Record<string, unknown>,
  allowed: readonly string[],
) {
  return Object.fromEntries(
    allowed
      .filter(
        (key) => JSON.stringify(original[key]) !== JSON.stringify(next[key]),
      )
      .map((key) => [key, next[key]]),
  );
}
