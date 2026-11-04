import type { SessionDto } from "@/features/auth/types/auth.types";
import {
  BellRing,
  Building2,
  ChartNoAxesCombined,
  CircleCheckBig,
  ClipboardList,
  FileChartColumn,
  FileText,
  FolderKanban,
  Gauge,
  House,
  Layers,
  ListFilter,
  TriangleAlert,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type Area = "workspace" | "admin";
export type NavChild = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};
// Mục có mục con hiện thành menu thả xuống ngay trên nút của nó (như Jira); mục con
// suy ra từ trang đang mở để giữ phạm vi lọc khi chuyển giữa các mục.
export type NavContext = {
  userId: string;
  role: SessionDto["user"]["systemRole"];
  pathname: string;
  search: URLSearchParams;
};
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: RegExp;
  placement?: "sidebar" | "header";
  children?: (context: NavContext) => NavChild[];
};

const analyticsPaths = [
  "/dashboard",
  "/analytics/risks",
  "/analytics/workload",
  "/analytics/bottlenecks",
  "/analytics/summary",
];
// Các màn phân tích dùng chung phạm vi lọc trên URL; cảnh báo có bộ lọc riêng.
function analyticsChildren({ pathname, search }: NavContext): NavChild[] {
  const scope =
    analyticsPaths.includes(pathname) && search.size ? `?${search}` : "";
  return [
    { href: "/dashboard", label: "Tổng quan", icon: ChartNoAxesCombined },
    { href: "/analytics/risks", label: "Nguy cơ trễ hạn", icon: TriangleAlert },
    { href: "/analytics/workload", label: "Khối lượng", icon: Gauge },
    { href: "/analytics/bottlenecks", label: "Điểm nghẽn", icon: Layers },
    { href: "/analytics/summary", label: "Tổng hợp", icon: FileText },
  ]
    .map((item) => ({
      ...item,
      active: pathname === item.href,
      href: item.href + scope,
    }))
    .concat({
      href: "/alerts",
      label: "Cảnh báo",
      icon: BellRing,
      active: pathname === "/alerts",
    });
}

// Lối tắt lọc của danh sách công việc: giữ dự án, tìm kiếm và chế độ xem đang chọn,
// bỏ trang; chọn lại mục đang bật thì tắt bộ lọc đó.
function taskChildren({
  userId,
  role,
  pathname,
  search,
}: NavContext): NavChild[] {
  const here = pathname === "/tasks";
  const base = new URLSearchParams(here ? search : undefined);
  const mine = here && base.get("assigneeId") === userId;
  const overdue = here && base.get("overdue") === "true";
  const href = (change: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(base);
    next.delete("page");
    change(next);
    return `/tasks${next.size ? `?${next}` : ""}`;
  };
  return [
    {
      href: href((next) => {
        next.delete("assigneeId");
        next.delete("overdue");
        next.delete("status");
      }),
      label: "Tất cả",
      icon: ClipboardList,
      active: here && !base.get("assigneeId") && !overdue,
    },
    ...(role === "EMPLOYEE"
      ? []
      : [
          {
            href: href((next) => {
              if (mine) next.delete("assigneeId");
              else next.set("assigneeId", userId);
            }),
            label: "Việc của tôi",
            icon: UserRound,
            active: mine,
          },
        ]),
    {
      href: href((next) => {
        next.delete("status");
        if (overdue) next.delete("overdue");
        else next.set("overdue", "true");
      }),
      label: "Việc quá hạn",
      icon: ListFilter,
      active: overdue,
    },
  ];
}

// Hai khu vực có menu riêng; quyền mở từng mục do canVisit (lib/auth/access).
export const navigation: Record<Area, NavItem[]> = {
  workspace: [
    {
      href: "/workspace",
      label: "Tổng quan",
      icon: House,
      match: /^\/workspace/,
    },
    {
      href: "/projects",
      label: "Dự án",
      icon: FolderKanban,
      match: /^\/projects(?:\/|$)/,
    },
    {
      href: "/tasks",
      label: "Công việc",
      icon: ClipboardList,
      match: /^\/tasks(?:\/|$)/,
      children: taskChildren,
    },
    {
      href: "/reviews",
      label: "Nghiệm thu",
      placement: "header",
      icon: CircleCheckBig,
      match: /^\/reviews(?:\/|$)/,
    },
    {
      href: "/reports",
      label: "Báo cáo",
      icon: FileChartColumn,
      match: /^\/reports(?:\/|$)/,
    },
    {
      href: "/dashboard",
      label: "Phân tích",
      placement: "header",
      icon: ChartNoAxesCombined,
      match: /^\/(?:dashboard|analytics|alerts)(?:\/|$)/,
      children: analyticsChildren,
    },
  ],
  admin: [
    {
      href: "/admin/users",
      label: "Tài khoản",
      icon: Users,
      match: /^\/admin\/users(?:\/|$)/,
    },
    {
      href: "/admin/organization",
      label: "Đơn vị",
      icon: Building2,
      match: /^\/admin\/organization(?:\/|$)/,
    },
    {
      href: "/admin/teams",
      label: "Nhóm nhân sự",
      icon: UsersRound,
      match: /^\/admin\/teams(?:\/|$)/,
    },
  ],
};

const areaOf = (pathname: string): Area =>
  /^\/admin(?:\/|$)/.test(pathname) ? "admin" : "workspace";

// Các trang danh sách ghi nhớ URL gần nhất (bộ lọc, chế độ xem, trang) để các
// trang con quay lại đúng trạng thái đang xem.
const lists = new Set([
  "/workspace",
  "/projects",
  "/tasks",
  "/reports",
  "/reviews",
  "/dashboard",
  "/alerts",
  "/analytics/risks",
  "/analytics/workload",
  "/analytics/bottlenecks",
  "/analytics/summary",
  "/admin/users",
  "/admin/organization",
  "/admin/teams",
]);
export const listRoute = (path: string) =>
  lists.has(path) || /^\/projects\/[^/]+\/tasks$/.test(path);

// Dự án đang xem để bộ chọn dự án hiển thị: ID trong /projects/:id, hoặc dự án
// cha của công việc đang mở (tên công việc đã đăng ký kèm projectId).
export function currentProjectId(
  pathname: string,
  entity: (kind: string, id: string) => { parentId?: string } | undefined,
) {
  const project = /^\/projects\/([^/]+)/.exec(pathname);
  if (project) return project[1] === "new" ? undefined : d(project[1]);
  const task = /^\/tasks\/([^/]+)/.exec(pathname);
  return task ? entity("task", d(task[1]))?.parentId : undefined;
}

// Đích sau đăng nhập chỉ nhận đường dẫn trong ứng dụng, tránh chuyển hướng ra ngoài.
export function safeNext(value: string | null) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/login")
    ? value
    : "/workspace";
}

type Crumb = { label: string; href?: string };
export type Trail = { crumbs: Crumb[]; back: string };
type Entity = { label: string; parentId?: string };
export type TrailContext = {
  pathname: string;
  search: URLSearchParams;
  entity: (kind: string, id: string) => Entity | undefined;
  list: (path: string) => string | undefined;
  previous: string | null;
};

const e = encodeURIComponent;
const d = (value: string) => decodeURIComponent(value);
const pending = "…";
const isAppPath = (url: string | null): url is string =>
  Boolean(url && url.startsWith("/") && !url.startsWith("//"));

// Breadcrumb và đích "Quay lại" suy ra từ URL. Đích luôn là trang cha trong
// ứng dụng nên mở trực tiếp hoặc ở tab mới vẫn có chỗ quay về; riêng trang
// không có cha cố định thì dùng trang trước nếu có.
export function trailFor(ctx: TrailContext): Trail | null {
  const trail = buildTrail(ctx);
  if (!trail) return null;
  // Trang con của một danh sách quay về đúng danh sách người dùng vừa rời, kể cả
  // khi khác cha trực tiếp (như công việc cá nhân), cùng bộ lọc và phân trang.
  const { previous, pathname } = ctx;
  if (!isAppPath(previous)) return trail;
  const from = previous.split("?")[0];
  if (
    listRoute(trail.back.split("?")[0]) &&
    listRoute(from) &&
    from !== pathname &&
    areaOf(from) === areaOf(pathname)
  )
    return { ...trail, back: previous };
  return trail;
}

function buildTrail(ctx: TrailContext): Trail | null {
  const { pathname, search } = ctx;
  const list = (path: string) => ctx.list(path) ?? path;
  const crumbsOf = (...crumbs: Crumb[]): Trail => {
    const parents = crumbs.filter((crumb) => crumb.href);
    return { crumbs, back: parents[parents.length - 1].href as string };
  };
  const projectLabel = (id: string) =>
    ctx.entity("project", id)?.label ?? pending;
  // Công việc của dự án nằm trong khu dự án; chưa biết dự án thì dùng danh sách chung.
  const tasks = (projectId?: string) =>
    projectId ? list(`/projects/${e(projectId)}/tasks`) : list("/tasks");
  const contextual = (fallback: string) =>
    isAppPath(ctx.previous) && ctx.previous.split("?")[0] !== pathname
      ? ctx.previous
      : fallback;
  let m: RegExpExecArray | null;

  if (pathname === "/projects/new")
    return crumbsOf(
      { label: "Dự án", href: list("/projects") },
      { label: "Tạo dự án" },
    );
  if (
    (m = /^\/projects\/([^/]+)(?:\/(edit|members|tasks|tasks\/new))?$/.exec(
      pathname,
    ))
  ) {
    const id = d(m[1]);
    const root = `/projects/${e(id)}`;
    const base: Crumb[] = [
      { label: "Dự án", href: list("/projects") },
      { label: projectLabel(id), href: root },
    ];
    if (m[2] === "edit")
      return crumbsOf(...base, { label: "Chỉnh sửa kế hoạch" });
    if (m[2] === "members") return crumbsOf(...base, { label: "Thành viên" });
    if (m[2] === "tasks") return crumbsOf(...base, { label: "Công việc" });
    if (m[2] === "tasks/new")
      return crumbsOf(
        ...base,
        { label: "Công việc", href: tasks(id) },
        { label: "Tạo công việc" },
      );
    if (search.get("tab") === "history")
      return crumbsOf(...base, { label: "Lịch sử" });
    return crumbsOf(base[0], { label: base[1].label });
  }
  if (
    (m =
      /^\/tasks\/([^/]+)(?:\/(edit|time-logs|submissions|history|submissions\/([^/]+)))?$/.exec(
        pathname,
      ))
  ) {
    const id = d(m[1]);
    const task = ctx.entity("task", id);
    const root = `/tasks/${e(id)}`;
    const base: Crumb[] = task?.parentId
      ? [
          { label: "Dự án", href: list("/projects") },
          {
            label: projectLabel(task.parentId),
            href: `/projects/${e(task.parentId)}`,
          },
          { label: "Công việc", href: tasks(task.parentId) },
        ]
      : [{ label: "Công việc", href: tasks() }];
    const self: Crumb = { label: task?.label ?? pending };
    if (!m[2]) return crumbsOf(...base, self);
    const parent: Crumb = { ...self, href: root };
    if (m[2] === "edit")
      return crumbsOf(...base, parent, { label: "Điều chỉnh" });
    if (m[2] === "time-logs")
      return crumbsOf(...base, parent, { label: "Giờ công" });
    if (m[2] === "history")
      return crumbsOf(...base, parent, { label: "Lịch sử" });
    if (m[2] === "submissions")
      return crumbsOf(...base, parent, { label: "Các lần nộp" });
    const submission = ctx.entity("submission", d(m[3]));
    return crumbsOf(
      ...base,
      parent,
      { label: "Các lần nộp", href: `${root}/submissions` },
      { label: submission?.label ?? pending },
    );
  }
  if (pathname === "/reports/new")
    return crumbsOf(
      { label: "Báo cáo", href: list("/reports") },
      { label: "Lập báo cáo" },
    );
  if ((m = /^\/reports\/([^/]+)(?:\/(edit))?$/.exec(pathname))) {
    const id = d(m[1]);
    const label = ctx.entity("report", id)?.label ?? pending;
    const base: Crumb = { label: "Báo cáo", href: list("/reports") };
    return m[2]
      ? crumbsOf(
          base,
          { label, href: `/reports/${e(id)}` },
          { label: "Chỉnh sửa" },
        )
      : crumbsOf(base, { label });
  }
  if ((m = /^\/alerts\/([^/]+)$/.exec(pathname)))
    return crumbsOf(
      { label: "Cảnh báo", href: list("/alerts") },
      { label: ctx.entity("alert", d(m[1]))?.label ?? pending },
    );
  if ((m = /^\/analytics\/(details|jobs)\/([^/]+)$/.exec(pathname))) {
    const kind = m[1] === "details" ? "analysis" : "job";
    return {
      crumbs: [
        { label: "Phân tích", href: list("/dashboard") },
        {
          label:
            ctx.entity(kind, d(m[2]))?.label ??
            (kind === "analysis"
              ? "Chi tiết phân tích"
              : "Tiến trình diễn giải"),
        },
      ],
      back: contextual(list("/dashboard")),
    };
  }
  if ((m = /^\/users\/([^/]+)$/.exec(pathname)))
    return {
      crumbs: [
        { label: "Hồ sơ thành viên" },
        { label: ctx.entity("user", d(m[1]))?.label ?? pending },
      ],
      back: contextual("/workspace"),
    };
  if ((m = /^\/admin\/(users|organization|teams)\/([^/]+)$/.exec(pathname))) {
    const section = {
      users: ["Tài khoản", "user", "Tạo tài khoản"],
      organization: ["Đơn vị", "unit", "Tạo đơn vị"],
      teams: ["Nhóm nhân sự", "team", "Tạo nhóm"],
    }[m[1] as "users" | "organization" | "teams"];
    return crumbsOf(
      { label: section[0], href: list(`/admin/${m[1]}`) },
      {
        label:
          m[2] === "new"
            ? section[2]
            : (ctx.entity(section[1], d(m[2]))?.label ?? pending),
      },
    );
  }
  return null;
}
