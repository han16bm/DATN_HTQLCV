// @vitest-environment jsdom
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { authKeys } from "@/features/auth/api/auth.keys";
import { authService } from "@/features/auth/api/auth.service";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { TaskShell } from "@/features/tasks/components/task-shell";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { notificationsService } from "@/features/notifications/api/notifications.service";
import { Session } from "@/lib/auth/session-context";
import { resetMockState, server } from "@/mocks/node";
import { registerRefresh, token } from "@/services/api-client";
import { usePreferences } from "@/stores/preferences-store";
import { useUI } from "@/stores/ui-store";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { webcrypto } from "node:crypto";
import { type ReactNode } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from "vitest";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  resetMockState();
  server.resetHandlers();
  token.set(null);
  registerRefresh(null);
  useUI.getState().reset();
  vi.clearAllMocks();
  history.replaceState(null, "", "/");
});
const clients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  for (const client of clients) client.clear();
  clients.length = 0;
  vi.unstubAllGlobals();
});
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });

it.each(["lan", "minh", "admin"])(
  "keeps common functions in the sidebar and additional management functions on the header for %s",
  async (username) => {
    history.replaceState(null, "", "/workspace");
    const session = await login(username);
    show(
      <WorkspaceShell>
        <p>Trang chủ</p>
      </WorkspaceShell>,
      session,
    );
    const main = screen.getByRole("navigation", { name: "Điều hướng chính" });
    expect(
      within(main)
        .getByRole("link", { name: "Tổng quan" })
        .getAttribute("href"),
    ).toBe("/workspace");
    expect(within(main).queryByText("Công việc của tôi")).toBeNull();
    const sidebar = screen.queryByRole("complementary", {
      name: "Thanh điều hướng",
    });
    const header = screen
      .getByRole("button", { name: "Mở menu tài khoản" })
      .closest("header")!;
    expect(sidebar?.contains(main)).toBe(true);
    expect(header.contains(main)).toBe(false);
    expect(
      screen.queryByRole("button", { name: "Thu gọn thanh điều hướng" }),
    ).toBeNull();
    expect(within(main).queryByRole("link", { name: "Nghiệm thu" })).toBeNull();
    expect(
      within(main).queryByRole("button", { name: "Phân tích" }),
    ).toBeNull();
    const management = within(header).queryByRole("navigation", {
      name: "Điều hướng quản lý",
    });
    if (username === "minh") {
      expect(
        within(management!).getByRole("link", { name: "Nghiệm thu" }),
      ).toBeTruthy();
      expect(
        within(management!).getByRole("button", { name: "Phân tích" }),
      ).toBeTruthy();
      expect(within(management!).queryByText("Tổng quan")).toBeNull();
      expect(within(management!).queryByText("Công việc")).toBeNull();
    } else if (username === "admin") {
      // Admin chỉ xem: có Phân tích (quyền xem toàn hệ thống), không có Nghiệm thu.
      expect(
        within(management!).getByRole("button", { name: "Phân tích" }),
      ).toBeTruthy();
      expect(
        within(management!).queryByRole("link", { name: "Nghiệm thu" }),
      ).toBeNull();
    } else expect(management).toBeNull();
    const user = userEvent.setup();
    await user.click(within(main).getByRole("button", { name: "Công việc" }));
    expect(Boolean(screen.queryByRole("link", { name: "Việc của tôi" }))).toBe(
      session.user.systemRole !== "EMPLOYEE",
    );
  },
);

it("keeps employee navigation usable when collapsed and retains task filters", async () => {
  history.replaceState(
    null,
    "",
    "/tasks?projectId=p-main&q=API&view=board&page=3",
  );
  const session = await login("lan");
  show(
    <WorkspaceShell>
      <p>Danh sách</p>
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  act(() => useUI.getState().toggleSidebar());
  const main = within(
    screen.getByRole("navigation", { name: "Điều hướng chính" }),
  );
  const trigger = main.getByRole("button", { name: "Công việc" });
  expect(main.getByRole("link", { name: "Dự án" }).getAttribute("href")).toBe(
    "/projects",
  );
  await user.click(trigger);
  const overdue = await screen.findByRole("menuitem", { name: "Việc quá hạn" });
  expect(screen.queryByRole("menuitem", { name: "Việc của tôi" })).toBeNull();
  const target = new URL(overdue.getAttribute("href")!, location.origin);
  expect(Object.fromEntries(target.searchParams)).toEqual({
    projectId: "p-main",
    q: "API",
    view: "board",
    overdue: "true",
  });
  await user.keyboard("{Escape}");
  expect(document.activeElement).toBe(trigger);
  await user.keyboard("{Control>}[BracketLeft]{/Control}");
  expect(useUI.getState().sidebarCollapsed).toBe(false);
});

function Provider({
  session,
  children,
}: {
  session: SessionDto | null;
  children: ReactNode;
}) {
  const query = useQuery({
    queryKey: authKeys.getSession(session?.user.id),
    queryFn: () => authService.getSession(),
    initialData: session ?? undefined,
    enabled: Boolean(session),
    staleTime: Infinity,
  });
  return (
    <Session
      value={{
        session: session ? (query.data ?? session) : null,
        loading: false,
        refresh: query.refetch,
        signIn: async () => {},
        signOut: async () => {},
      }}
    >
      {children}
      <ConfirmDialog />
    </Session>
  );
}
function show(children: ReactNode, session: SessionDto | null) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <Provider session={session}>{children}</Provider>
    </QueryClientProvider>,
  );
  return client;
}
const location_ = () =>
  screen.getByRole("navigation", { name: "Vị trí hiện tại" });
const task = (
  <TaskShell taskId="t-3">
    <p>Nội dung công việc</p>
  </TaskShell>
);

it("opens manager task filters from the collapsed common sidebar", async () => {
  history.replaceState(null, "", "/tasks");
  const session = await login("minh");
  show(
    <WorkspaceShell>
      <p>Danh sách</p>
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  expect(
    screen.getByRole("complementary", { name: "Thanh điều hướng" }),
  ).toBeTruthy();
  act(() => useUI.getState().toggleSidebar());
  await user.click(screen.getByRole("button", { name: "Công việc" }));
  const item = await screen.findByRole("menuitem", { name: "Việc của tôi" });
  expect(item.getAttribute("href")).toBe(
    `/tasks?assigneeId=${session.user.id}`,
  );
});

it("preserves project, search and view in the task menu and removes the page", async () => {
  history.replaceState(
    null,
    "",
    "/tasks?projectId=p-main&q=API&view=board&page=3&status=TODO",
  );
  const session = await login("minh");
  show(
    <WorkspaceShell>
      <p>Danh sách</p>
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  act(() => useUI.getState().toggleSidebar());
  await user.click(screen.getByRole("button", { name: "Công việc" }));
  const next = new URL(
    (
      await screen.findByRole("menuitem", { name: "Việc của tôi" })
    ).getAttribute("href")!,
    location.origin,
  );
  expect(next.pathname).toBe("/tasks");
  expect(Object.fromEntries(next.searchParams)).toEqual({
    projectId: "p-main",
    q: "API",
    view: "board",
    status: "TODO",
    assigneeId: session.user.id,
  });
  const overdue = new URL(
    screen
      .getByRole("menuitem", { name: "Việc quá hạn" })
      .getAttribute("href")!,
    location.origin,
  );
  expect(overdue.searchParams.get("overdue")).toBe("true");
  expect(overdue.searchParams.has("assigneeId")).toBe(false);
  expect(nav.push).not.toHaveBeenCalled();
});

it("names the project and task in the breadcrumb and goes back to the remembered list with its filters", async () => {
  const session = await login("minh");
  const list = "/projects/p-main?status=TODO&view=board&page=2";
  useUI.getState().visit(list);
  history.replaceState(null, "", "/tasks/t-3");
  show(<WorkspaceShell>{task}</WorkspaceShell>, session);
  const crumbs = location_();
  expect(
    await within(crumbs).findByText("Thiết kế luồng giao việc"),
  ).toBeTruthy();
  expect(within(crumbs).getByText("Cổng quản lý nội bộ")).toBeTruthy();
  expect(within(crumbs).queryByText("t-3")).toBeNull();
  expect(
    within(crumbs).getByRole("link", { name: "Quay lại" }).getAttribute("href"),
  ).toBe(list + "#tasks");
  expect(
    within(crumbs).getByRole("link", { name: "Dự án" }).getAttribute("href"),
  ).toBe("/projects");
  // Mục hiện tại không phải liên kết.
  expect(
    within(crumbs).queryByRole("link", { name: "Thiết kế luồng giao việc" }),
  ).toBeNull();
});

it("gives a task opened directly in a new tab a parent in the app instead of browser history", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-3/time-logs");
  show(
    <WorkspaceShell>
      <TaskShell taskId="t-3">
        <p>Giờ công</p>
      </TaskShell>
    </WorkspaceShell>,
    session,
  );
  const crumbs = location_();
  await within(crumbs).findByRole("link", { name: "Thiết kế luồng giao việc" });
  expect(
    within(crumbs).getByRole("link", { name: "Quay lại" }).getAttribute("href"),
  ).toBe("/tasks/t-3");
  expect(nav.back).not.toHaveBeenCalled();
});

it("asks before leaving through Back when a form has unsaved changes", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/projects/p-main/members");
  show(
    <WorkspaceShell>
      <p>Thành viên</p>
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  act(() => useUI.getState().markDirty("members-form", true));
  await user.click(within(location_()).getByRole("link", { name: "Quay lại" }));
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Ở lại" }));
  expect(nav.push).not.toHaveBeenCalled();
  await user.click(within(location_()).getByRole("link", { name: "Quay lại" }));
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Bỏ thay đổi",
    }),
  );
  expect(nav.push).toHaveBeenCalledWith("/projects/p-main");
});

it("sends an expired session to sign-in and returns to the same page afterwards", async () => {
  history.replaceState(null, "", "/tasks/t-3?tab=x");
  show(
    <WorkspaceShell>
      <p>Không hiển thị</p>
    </WorkspaceShell>,
    null,
  );
  expect(nav.replace).toHaveBeenCalledWith(
    "/login?next=%2Ftasks%2Ft-3%3Ftab%3Dx&expired=1",
  );
  expect(screen.queryByText("Không hiển thị")).toBeNull();
});

it("signs out deliberately without remembering the page or the expired notice", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/workspace");
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Mở menu tài khoản" }));
  await user.click(
    within(await screen.findByRole("menu")).getByRole("menuitem", {
      name: "Đăng xuất",
    }),
  );
  await vi.waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/login"));
  expect(
    nav.replace.mock.calls.some(([url]) => String(url).includes("next=")),
  ).toBe(false);
});

it("drops the entity names from the breadcrumb once the API denies the entity", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-3");
  const client = show(<WorkspaceShell>{task}</WorkspaceShell>, session);
  await within(location_()).findByText("Thiết kế luồng giao việc");
  server.use(
    http.get("*/api/tasks/t-3", () =>
      HttpResponse.json(
        { code: "FORBIDDEN", message: "Bạn không còn quyền xem công việc." },
        { status: 403 },
      ),
    ),
  );
  await act(async () => {
    await client.refetchQueries({ queryKey: ["tasks"] });
  });
  expect(
    await screen.findByText("Bạn không còn quyền xem công việc."),
  ).toBeTruthy();
  await vi.waitFor(() =>
    expect(
      within(location_()).queryByText("Thiết kế luồng giao việc"),
    ).toBeNull(),
  );
  expect(useUI.getState().labels["task:t-3"]).toBeUndefined();
});

it("puts the project switcher where the logo was, next to the account menu and without a global Create action", async () => {
  history.replaceState(null, "", "/workspace");
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("minh"),
  );
  // Không có logo, ô tìm kiếm chung hay lối tắt lập báo cáo trên thanh trên.
  expect(screen.queryByRole("link", { name: "Cổng công việc" })).toBeNull();
  expect(screen.queryByRole("searchbox")).toBeNull();
  expect(screen.queryByRole("button", { name: "Tạo" })).toBeNull();
  expect(
    screen.getByRole("button", { name: "Dự án: Chọn dự án" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Mở menu tài khoản" }),
  ).toBeTruthy();
  cleanup();
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("lan"),
  );
  expect(screen.queryByRole("button", { name: "Tạo" })).toBeNull();
  expect(
    screen.getByRole("button", { name: "Dự án: Chọn dự án" }),
  ).toBeTruthy();
});

it("lists recently opened items once under Gần đây instead of repeating projects under Dự án", async () => {
  history.replaceState(null, "", "/tasks/t-3");
  show(<WorkspaceShell>{task}</WorkspaceShell>, await login("lan"));
  const sidebar = screen.getByRole("complementary", {
    name: "Thanh điều hướng",
  });
  const recent = await within(sidebar).findAllByRole("link", {
    name: "Cổng quản lý nội bộ",
  });
  expect(recent).toHaveLength(1);
  expect(recent[0].getAttribute("href")).toBe("/projects/p-main");
  expect(
    within(sidebar)
      .getByRole("link", { name: "Thiết kế luồng giao việc" })
      .getAttribute("href"),
  ).toBe("/tasks/t-3");
});

const switcher = (name: string) => screen.getByRole("button", { name });

it("shows the project of the open project or task in the switcher", async () => {
  history.replaceState(null, "", "/tasks/t-3");
  show(<WorkspaceShell>{task}</WorkspaceShell>, await login("minh"));
  expect(
    await screen.findByRole("button", { name: "Dự án: Cổng quản lý nội bộ" }),
  ).toBeTruthy();
});

it("searches the permitted projects and opens the project overview without carrying a filter", async () => {
  history.replaceState(null, "", "/tasks?status=TODO&view=board");
  show(
    <WorkspaceShell>
      <p>Danh sách</p>
    </WorkspaceShell>,
    await login("minh"),
  );
  const user = userEvent.setup();
  await user.click(switcher("Dự án: Chọn dự án"));
  const search = await screen.findByRole("combobox", { name: "Tìm dự án" });
  expect(document.activeElement).toBe(search);
  await user.type(search, "cổng");
  const option = await screen.findByRole("option", {
    name: /Cổng quản lý nội bộ/,
  });
  await user.click(option);
  await vi.waitFor(() =>
    expect(nav.push).toHaveBeenCalledWith("/projects/p-main"),
  );
  expect(nav.replace).not.toHaveBeenCalled();
});

it("selects with the keyboard and returns focus to the switcher on Escape", async () => {
  history.replaceState(null, "", "/workspace");
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("minh"),
  );
  const user = userEvent.setup();
  const trigger = switcher("Dự án: Chọn dự án");
  await user.click(trigger);
  const search = await screen.findByRole("combobox", { name: "Tìm dự án" });
  await screen.findAllByRole("option");
  await user.keyboard("{Escape}");
  await vi.waitFor(() => expect(screen.queryByRole("combobox")).toBeNull());
  expect(document.activeElement).toBe(trigger);
  expect(search.isConnected).toBe(false);
  await user.keyboard("{Alt>}p{/Alt}");
  const reopened = await screen.findByRole("combobox", { name: "Tìm dự án" });
  await screen.findAllByRole("option");
  await user.type(reopened, "{Enter}");
  await vi.waitFor(() => expect(nav.push).toHaveBeenCalled());
  expect(String(nav.push.mock.calls[0][0])).toMatch(/^\/projects\/p-/);
});

it("says so when no permitted project matches the search", async () => {
  history.replaceState(null, "", "/workspace");
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("minh"),
  );
  const user = userEvent.setup();
  await user.click(switcher("Dự án: Chọn dự án"));
  await user.type(
    await screen.findByRole("combobox", { name: "Tìm dự án" }),
    "không có dự án này",
  );
  expect(
    await screen.findByText("Không có dự án nào khớp “không có dự án này”."),
  ).toBeTruthy();
});

it("loads more projects page by page from the list API", async () => {
  history.replaceState(null, "", "/workspace");
  const row = (n: number) => ({
    id: `p-x${n}`,
    name: `Dự án mẫu ${n}`,
    startDate: "2026-10-01",
    dueAt: "2026-12-31T10:00:00.000Z",
    status: "ACTIVE",
    owner: { id: "u-1", displayName: "Người phụ trách" },
    unit: { id: "unit-product", name: "Khối sản phẩm" },
  });
  const pages: number[] = [];
  server.use(
    http.get("*/api/projects", ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get("page") ?? 1);
      pages.push(page);
      return HttpResponse.json({
        items: Array.from({ length: page === 1 ? 20 : 5 }, (_, i) =>
          row((page - 1) * 20 + i + 1),
        ),
        pagination: { page, pageSize: 20, total: 25 },
      });
    }),
  );
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("minh"),
  );
  const user = userEvent.setup();
  await user.click(switcher("Dự án: Chọn dự án"));
  expect(await screen.findAllByRole("option")).toHaveLength(20);
  await user.click(screen.getByRole("button", { name: /Tải thêm dự án/ }));
  expect(await screen.findAllByRole("option")).toHaveLength(25);
  expect(pages).toEqual([1, 2]);
  expect(screen.queryByRole("button", { name: /Tải thêm dự án/ })).toBeNull();
});

it("asks before leaving through the switcher when a form has unsaved changes", async () => {
  history.replaceState(null, "", "/workspace");
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("minh"),
  );
  const user = userEvent.setup();
  act(() => useUI.getState().markDirty("any-form", true));
  await user.click(switcher("Dự án: Chọn dự án"));
  await user.click(
    await screen.findByRole("option", { name: /Cổng quản lý nội bộ/ }),
  );
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Ở lại" }));
  expect(nav.push).not.toHaveBeenCalled();
});

const media = (matches: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

it("has no separate task section navigation because time logs, results and history live on the detail page", async () => {
  media(true);
  history.replaceState(null, "", "/tasks/t-3");
  show(<WorkspaceShell>{task}</WorkspaceShell>, await login("minh"));
  await screen.findByRole("navigation", { name: "Điều hướng chính" });
  expect(
    screen.queryByRole("navigation", { name: "Mục công việc" }),
  ).toBeNull();
  expect(screen.queryByRole("link", { name: "Giờ công" })).toBeNull();
});

it("collapses the employee sidebar from the interface settings and keeps the header free of a collapse button", async () => {
  history.replaceState(null, "", "/tasks/t-3");
  show(
    <WorkspaceShell>
      <p>Danh sách</p>
    </WorkspaceShell>,
    await login("lan"),
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Cài đặt giao diện" }));
  await user.click(
    await screen.findByRole("switch", { name: "Thu gọn thanh bên" }),
  );
  expect(useUI.getState().sidebarCollapsed).toBe(true);
  await user.keyboard("{Escape}");
  await act(async () => {});
  const header = screen
    .getByRole("button", { name: "Mở menu tài khoản" })
    .closest("header")!;
  expect(
    within(header).getByRole("button", { name: "Dự án: Chọn dự án" }),
  ).toBeTruthy();
  expect(screen.queryByRole("button", { name: /thanh điều hướng/ })).toBeNull();
});

it("loads notifications on open, marks the selected event read and opens its task", async () => {
  await login("minh");
  const task = await tasksService.getTask("t-1");
  await tasksService.assignTask(
    task.id,
    { assigneeId: "u-lan" },
    { version: task.version, key: crypto.randomUUID() },
  );
  history.replaceState(null, "", "/workspace");
  const requests: string[] = [];
  const observe = ({ request }: { request: Request }) => {
    if (new URL(request.url).pathname === "/api/notifications")
      requests.push(request.url);
  };
  server.events.on("request:start", observe);
  try {
    show(
      <WorkspaceShell>
        <p>Trang chủ</p>
      </WorkspaceShell>,
      await login("lan"),
    );
    const trigger = await screen.findByRole("button", {
      name: "Thông báo, 1 chưa đọc",
    });
    expect(requests).toEqual([]);
    const user = userEvent.setup();
    await user.click(trigger);
    const notice = await screen.findByRole("button", {
      name: /Mở thông báo: Bạn được giao công việc/,
    });
    expect(requests).toHaveLength(1);
    await user.keyboard("{Escape}");
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    await user.click(trigger);
    await user.click(
      await screen.findByRole("button", {
        name: /Mở thông báo: Bạn được giao công việc/,
      }),
    );
    await vi.waitFor(() =>
      expect(nav.push).toHaveBeenCalledWith(`/tasks/${task.id}`),
    );
    expect(notice.isConnected).toBe(false);
    expect(await notificationsService.summary()).toEqual({ unreadCount: 0 });
  } finally {
    server.events.removeListener("request:start", observe);
  }
});
it("preserves unsaved changes and unread state when notification navigation is cancelled", async () => {
  await login("minh");
  const task = await tasksService.getTask("t-1");
  await tasksService.assignTask(
    task.id,
    { assigneeId: "u-lan" },
    { version: task.version, key: crypto.randomUUID() },
  );
  show(
    <WorkspaceShell>
      <p>Đang soạn báo cáo</p>
    </WorkspaceShell>,
    await login("lan"),
  );
  act(() => useUI.getState().markDirty("report-draft", true));
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "Thông báo, 1 chưa đọc" }),
  );
  await user.click(
    await screen.findByRole("button", {
      name: /Mở thông báo: Bạn được giao công việc/,
    }),
  );
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ở lại",
    }),
  );
  expect(nav.push).not.toHaveBeenCalled();
  expect(useUI.getState().dirtyForms).toEqual(["report-draft"]);
  expect(await notificationsService.summary()).toEqual({ unreadCount: 1 });
});
it("retries the notification list over HTTP after an error", async () => {
  let reads = 0;
  server.use(
    http.get("*/api/notifications", () => {
      reads++;
      return reads === 1
        ? HttpResponse.json(
            { code: "TEMPORARY", message: "Chưa tải được thông báo." },
            { status: 503 },
          )
        : HttpResponse.json({
            items: [],
            pagination: { page: 1, pageSize: 10, total: 0 },
          });
    }),
  );
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("lan"),
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: /Thông báo/ }));
  await user.click(await screen.findByRole("button", { name: "Thử tải lại" }));
  expect(await screen.findByText("Chưa có thông báo")).toBeTruthy();
  expect(reads).toBe(2);
});

it("keeps common functions in the sidebar on every manager workspace page", async () => {
  for (const path of [
    "/workspace",
    "/projects",
    "/projects/p-main",
    "/tasks/t-3",
    "/reviews",
    "/reports",
  ]) {
    history.replaceState(null, "", path);
    show(
      <WorkspaceShell>
        <p>Trang tổng hợp</p>
      </WorkspaceShell>,
      await login("minh"),
    );
    const sidebar = screen.getByRole("complementary", {
      name: "Thanh điều hướng",
    });
    expect(
      screen.queryByRole("button", { name: "Thu gọn thanh điều hướng" }),
    ).toBeNull();
    expect(
      sidebar.contains(
        screen.getByRole("navigation", { name: "Điều hướng chính" }),
      ),
    ).toBe(true);
    cleanup();
  }
});

it("hides the sidebar on request and brings it back from the header", async () => {
  history.replaceState(null, "", "/workspace");
  act(() => usePreferences.getState().set({ hideSidebar: true }));
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("minh"),
  );
  expect(screen.queryByRole("complementary")).toBeNull();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Hiện thanh bên" }));
  expect(usePreferences.getState().hideSidebar).toBe(false);
  expect(
    screen.getByRole("complementary", { name: "Thanh điều hướng" }),
  ).toBeTruthy();
  act(() => usePreferences.getState().reset());
});
