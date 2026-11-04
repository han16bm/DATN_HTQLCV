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

export function canAdminister(session: Session) {
  return (
    hasPermission(session, "USERS_MANAGE") ||
    hasPermission(session, "ORGANIZATION_MANAGE")
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
  { path: /^\/admin\/?$/, allow: canAdminister },
  {
    path: /^\/(?:dashboard|analytics|alerts)(?:\/|$)/,
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

// Trang đầu tiên của khu quản trị mà người dùng được phép mở.
export function adminHome(session: Session) {
  if (hasPermission(session, "USERS_MANAGE")) return "/admin/users";
  if (hasPermission(session, "ORGANIZATION_MANAGE"))
    return "/admin/organization";
  return null;
}
