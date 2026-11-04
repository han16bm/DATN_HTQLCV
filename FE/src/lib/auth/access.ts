import type { SessionDto } from "@/features/auth/types/auth.types";
import type { Permission } from "@/types/common";

type Session = SessionDto | null | undefined;

// Quyền hiệu lực do backend trả trong phiên: `permissions` ở phạm vi hệ thống,
// `projectAccess[].permissions` ở từng dự án. Role chỉ là nhóm vai trò để hiển
// thị; mọi quyết định mở trang hay thao tác đều đi qua các hàm trong file này.
// FE chỉ phản ánh quyền đã cấp, backend vẫn kiểm tra độc lập.

// Quyền cấp ở phạm vi hệ thống nhưng chỉ cho phép xem, áp dụng cho mọi dự án.
const readsEveryProject: readonly Permission[] = ["ANALYTICS_VIEW"];

// Có quyền ở phạm vi hệ thống, hoặc ở đúng dự án khi truyền projectId. Quyền
// quản trị tài khoản không kéo theo quyền sửa hay nghiệm thu dự án; Admin chỉ được xem
// qua ANALYTICS_VIEW ở phạm vi hệ thống.
export function hasPermission(
  session: Session,
  permission: Permission,
  projectId?: string,
) {
  if (!session) return false;
  if (!projectId) return session.permissions.includes(permission);
  return (
    (readsEveryProject.includes(permission) &&
      session.permissions.includes(permission)) ||
    session.projectAccess.some(
      (access) =>
        access.projectId === projectId &&
        access.permissions.includes(permission),
    )
  );
}

// Có quyền ở hệ thống hoặc ít nhất một dự án; dùng cho menu và route chưa biết
// dự án. Dữ liệu cụ thể vẫn do hasPermission theo dự án và backend giới hạn.
export function hasAnyPermission(session: Session, permission: Permission) {
  return (
    hasPermission(session, permission) ||
    Boolean(
      session?.projectAccess.some((access) =>
        access.permissions.includes(permission),
      ),
    )
  );
}

// Thấy việc của người khác (quyền ở ít nhất một dự án hoặc xem toàn hệ thống): khi đó
// lối tắt "Việc của tôi" mới có ích; thành viên thường chỉ thấy việc của chính mình.
export const seesOthersTasks = (session: Session) =>
  hasPermission(session, "ANALYTICS_VIEW") ||
  Boolean(session?.projectAccess.some((access) => access.permissions.length));

// Các mã thuộc nhóm ADMIN trong danh mục chức năng (ADMIN_MODULES 1.1).
const adminPermissions: readonly Permission[] = [
  "USERS_MANAGE",
  "ORGANIZATION_MANAGE",
  "PERMISSIONS_MANAGE",
  "AUDIT_VIEW",
  "SETTINGS_MANAGE",
  "JOBS_MANAGE",
];
export function canAdminister(session: Session) {
  return adminPermissions.some((permission) =>
    hasPermission(session, permission),
  );
}

const routes: { path: RegExp; allow: (session: Session) => boolean }[] = [
  {
    path: /^\/admin\/users(?:\/|$)/,
    allow: (session) => hasPermission(session, "USERS_MANAGE"),
  },
  {
    path: /^\/admin\/(?:organization|teams)(?:\/|$)/,
    allow: (session) => hasPermission(session, "ORGANIZATION_MANAGE"),
  },
  {
    path: /^\/admin\/(?:permission-groups|features)(?:\/|$)/,
    allow: (session) => hasPermission(session, "PERMISSIONS_MANAGE"),
  },
  {
    path: /^\/admin\/audit-logs(?:\/|$)/,
    allow: (session) => hasPermission(session, "AUDIT_VIEW"),
  },
  {
    path: /^\/admin\/jobs(?:\/|$)/,
    allow: (session) => hasPermission(session, "JOBS_MANAGE"),
  },
  {
    path: /^\/admin\/(?:settings|ip-whitelist)(?:\/|$)/,
    allow: (session) => hasPermission(session, "SETTINGS_MANAGE"),
  },
  { path: /^\/admin\/?$/, allow: canAdminister },
  {
    // /alerts không chặn ở đây: cảnh báo là thông báo cá nhân, BE tự lọc theo người nhận
    path: /^\/(?:dashboard|analytics)(?:\/|$)/,
    allow: (session) => hasAnyPermission(session, "ANALYTICS_VIEW"),
  },
  {
    path: /^\/reviews(?:\/|$)/,
    allow: (session) => hasAnyPermission(session, "TASKS_REVIEW"),
  },
  {
    path: /^\/projects\/new\/?$/,
    allow: (session) => hasPermission(session, "PROJECT_CREATE"),
  },
  {
    path: /^\/projects\/[^/]+\/edit\/?$/,
    allow: (session) => hasAnyPermission(session, "PROJECT_MANAGE"),
  },
  {
    path: /^\/(?:projects\/[^/]+\/tasks\/new|tasks\/[^/]+\/edit)\/?$/,
    allow: (session) => hasAnyPermission(session, "TASKS_MANAGE"),
  },
];

// Một chính sách cho điều hướng và truy cập trực tiếp bằng URL. Trang mở được
// không có nghĩa là được ghi: thao tác trong trang xét lại theo dự án.
export function canVisit(session: Session, path: string) {
  if (!session) return false;
  const route = routes.find((route) => route.path.test(path));
  return !route || route.allow(session);
}
