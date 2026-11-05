import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  CircleCheckBig,
  ClipboardList,
  FileChartColumn,
  FileText,
  FolderKanban,
  Gauge,
  House,
  LayoutDashboard,
  ListTree,
  ScrollText,
  ShieldCheck,
  ShieldEllipsis,
  SlidersHorizontal,
  Timer,
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
export type NavContext = {
  userId: string;
  seesOthers: boolean;
  pathname: string;
  search: URLSearchParams;
};
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: RegExp;
  group?: string;
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
function analyticsChildren({ pathname, search }: NavContext): NavChild[] {
  const scope =
    analyticsPaths.includes(pathname) && search.size ? `?${search}` : "";
  return [
    { href: "/dashboard", label: "Tổng quan", icon: ChartNoAxesCombined },
    { href: "/analytics/risks", label: "Nguy cơ trễ hạn", icon: TriangleAlert },
    { href: "/analytics/workload", label: "Khối lượng", icon: Gauge },
    { href: "/analytics/bottlenecks", label: "Điểm nghẽn", icon: Layers },
    { href: "/analytics/summary", label: "Tổng hợp", icon: FileText },
  ].map((item) => ({
    ...item,
    active: pathname === item.href,
    href: item.href + scope,
  }));
}

function taskChildren({
  userId,
  seesOthers,
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
    ...(seesOthers
      ? [
          {
            href: href((next) => {
              if (mine) next.delete("assigneeId");
              else next.set("assigneeId", userId);
            }),
            label: "Việc của tôi",
            icon: UserRound,
            active: mine,
          },
        ]
      : []),
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
      href: "/alerts",
      label: "Cảnh báo",
      icon: Bell,
      match: /^\/alerts(?:\/|$)/,
    },
    {
      href: "/dashboard",
      label: "Phân tích",
      placement: "header",
      icon: ChartNoAxesCombined,
      match: /^\/(?:dashboard|analytics)(?:\/|$)/,
      children: analyticsChildren,
    },
  ],
  admin: [
    {
      href: "/admin",
      label: "Tổng quan",
      icon: LayoutDashboard,
      match: /^\/admin\/?$/,
    },
    {
      href: "/admin/users",
      label: "Người dùng",
      icon: Users,
      match: /^\/admin\/users(?:\/|$)/,
      group: "Người dùng & tổ chức",
    },
    {
      href: "/admin/organization",
      label: "Đơn vị",
      icon: Building2,
      match: /^\/admin\/organization(?:\/|$)/,
      group: "Người dùng & tổ chức",
    },
    {
      href: "/admin/teams",
      label: "Team",
      icon: UsersRound,
      match: /^\/admin\/teams(?:\/|$)/,
      group: "Người dùng & tổ chức",
    },
    {
      href: "/admin/permission-groups",
      label: "Nhóm quyền",
      icon: ShieldCheck,
      match: /^\/admin\/permission-groups(?:\/|$)/,
      group: "Phân quyền",
    },
    {
      href: "/admin/project-roles",
      label: "Vai trò dự án",
      icon: ShieldCheck,
      match: /^\/admin\/project-roles(?:\/|$)/,
      group: "Phân quyền",
    },
    {
      href: "/admin/features",
      label: "Danh mục chức năng",
      icon: ListTree,
      match: /^\/admin\/features(?:\/|$)/,
      group: "Phân quyền",
    },
    {
      href: "/admin/audit-logs",
      label: "Nhật ký hệ thống",
      icon: ScrollText,
      match: /^\/admin\/audit-logs(?:\/|$)/,
      group: "Giám sát",
    },
    {
      href: "/admin/jobs",
      label: "Job nền",
      icon: Timer,
      match: /^\/admin\/jobs(?:\/|$)/,
      group: "Giám sát",
    },
    {
      href: "/admin/settings",
      label: "Cấu hình tập trung",
      icon: SlidersHorizontal,
      match: /^\/admin\/settings(?:\/|$)/,
      group: "Cấu hình",
    },
    {
      href: "/admin/ip-whitelist",
      label: "IP whitelist",
      icon: ShieldEllipsis,
      match: /^\/admin\/ip-whitelist(?:\/|$)/,
      group: "Cấu hình",
    },
  ],
};

const areaOf = (pathname: string): Area =>
  /^\/admin(?:\/|$)/.test(pathname) ? "admin" : "workspace";

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
  "/admin/permission-groups",
  "/admin/audit-logs",
]);
export const listRoute = (path: string) =>
  lists.has(path) || /^\/projects\/(?!new$)[^/]+(?:\/tasks)?$/.test(path);

export type PageSearch = Record<string, string | string[] | undefined>;

export function projectUrl(
  projectId: string,
  search: PageSearch = {},
  section?: "tasks" | "members" | "history",
) {
  const query = new URLSearchParams();
  for (const [key, values] of Object.entries(search)) {
    for (const value of Array.isArray(values) ? values : [values])
      if (value !== undefined) query.append(key, value);
  }
  const keys =
    section === "members"
      ? ["q", "page"]
      : section === "history"
        ? ["page"]
        : [];
  for (const key of keys) {
    const value = query.get(key);
    if (value !== null) {
      query.set(`${section}.${key}`, value);
      query.delete(key);
    }
  }
  query.delete("tab");
  return `/projects/${encodeURIComponent(projectId)}${query.size ? `?${query}` : ""}${section ? `#${section}` : ""}`;
}

export function currentProjectId(
  pathname: string,
  entity: (kind: string, id: string) => { parentId?: string } | undefined,
) {
  const project = /^\/projects\/([^/]+)/.exec(pathname);
  if (project) return project[1] === "new" ? undefined : d(project[1]);
  const task = /^\/tasks\/([^/]+)/.exec(pathname);
  return task ? entity("task", d(task[1]))?.parentId : undefined;
}

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

export function trailFor(ctx: TrailContext): Trail | null {
  const trail = buildTrail(ctx);
  if (!trail) return null;
  const { previous, pathname } = ctx;
  if (!isAppPath(previous)) return trail;
  const from = previous.split(/[?#]/)[0];
  if (
    listRoute(trail.back.split(/[?#]/)[0]) &&
    listRoute(from) &&
    (!/^\/projects\/[^/]+$/.test(from) || /^\/tasks\/[^/]+$/.test(pathname)) &&
    from !== pathname &&
    areaOf(from) === areaOf(pathname)
  )
    return {
      ...trail,
      back: /^\/projects\/[^/]+$/.test(from)
        ? previous.split("#")[0] + "#tasks"
        : previous,
    };
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
  const tasks = (projectId?: string) =>
    projectId
      ? list(`/projects/${e(projectId)}`).split("#")[0] + "#tasks"
      : list("/tasks");
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
  if (
    (m =
      /^\/admin\/(users|organization|teams|permission-groups)\/([^/]+)$/.exec(
        pathname,
      ))
  ) {
    const section = {
      users: ["Người dùng", "user", "Tạo tài khoản"],
      organization: ["Đơn vị", "unit", "Tạo đơn vị"],
      teams: ["Team", "team", "Tạo nhóm"],
      "permission-groups": ["Nhóm quyền", "permission-group", "Tạo nhóm quyền"],
    }[m[1] as "users" | "organization" | "teams" | "permission-groups"];
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
