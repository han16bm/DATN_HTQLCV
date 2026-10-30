// @vitest-environment jsdom
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { authKeys } from "@/features/auth/api/auth.keys";
import { authService } from "@/features/auth/api/auth.service";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { TaskShell } from "@/features/tasks/components/task-shell";
import { Session } from "@/lib/auth/session-context";
import { resetMockState, server } from "@/mocks/node";
import { registerRefresh, token } from "@/services/api-client";
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

it("collapses and reopens the current sidebar section without navigating away", async () => {
  history.replaceState(null, "", "/tasks");
  const session = await login("minh");
  show(
    <WorkspaceShell>
      <p>Danh sách</p>
    </WorkspaceShell>,
    session,
  );
  const sidebar = within(
    screen.getByRole("complementary", { name: "Thanh điều hướng" }),
  );
  const user = userEvent.setup();
  expect(sidebar.getByRole("button", { name: "Việc của tôi" })).toBeTruthy();
  await user.click(sidebar.getByRole("button", { name: "Thu gọn Công việc" }));
  expect(sidebar.queryByRole("button", { name: "Việc của tôi" })).toBeNull();
  expect(
    sidebar
      .getByRole("link", { name: "Công việc" })
      .getAttribute("aria-current"),
  ).toBe("page");
  await user.click(sidebar.getByRole("button", { name: "Mở rộng Công việc" }));
  await user.click(sidebar.getByRole("button", { name: "Việc của tôi" }));
  expect(nav.replace).toHaveBeenCalledWith(
    `/tasks?assigneeId=${session.user.id}`,
    { scroll: false },
  );
  expect(nav.push).not.toHaveBeenCalled();
});

it("uses sidebar task filters on the same list and preserves its project, search and view", async () => {
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
  const sidebar = within(
    screen.getByRole("complementary", { name: "Thanh điều hướng" }),
  );
  const user = userEvent.setup();
  await user.click(sidebar.getByRole("button", { name: "Việc của tôi" }));
  const next = new URL(nav.replace.mock.calls.at(-1)![0], location.origin);
  expect(next.pathname).toBe("/tasks");
  expect(Object.fromEntries(next.searchParams)).toEqual({
    projectId: "p-main",
    q: "API",
    view: "board",
    status: "TODO",
    assigneeId: session.user.id,
  });
  await user.click(sidebar.getByRole("button", { name: "Việc quá hạn" }));
  const overdue = new URL(nav.replace.mock.calls.at(-1)![0], location.origin);
  expect(overdue.searchParams.get("overdue")).toBe("true");
  expect(overdue.searchParams.has("assigneeId")).toBe(false);
  expect(nav.push).not.toHaveBeenCalled();
});

it("names the project and task in the breadcrumb and goes back to the remembered list with its filters", async () => {
  const session = await login("minh");
  const list = "/projects/p-main/tasks?status=TODO&view=board&page=2";
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
  ).toBe(list);
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

it("keeps the top bar to the brand and account menu without a global Create action", async () => {
  history.replaceState(null, "", "/workspace");
  show(
    <WorkspaceShell>
      <p>Trang chủ</p>
    </WorkspaceShell>,
    await login("minh"),
  );
  // Không có ô tìm kiếm chung và không có lối tắt lập báo cáo trên thanh trên.
  expect(screen.queryByRole("searchbox")).toBeNull();
  expect(screen.queryByRole("button", { name: "Tạo" })).toBeNull();
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
  expect(screen.getByRole("link", { name: "Cổng công việc" })).toBeTruthy();
});

it("lists recently opened projects under Gần đây and Dự án in the sidebar", async () => {
  history.replaceState(null, "", "/tasks/t-3");
  show(<WorkspaceShell>{task}</WorkspaceShell>, await login("minh"));
  const sidebar = screen.getByRole("complementary", {
    name: "Thanh điều hướng",
  });
  const recent = await within(sidebar).findAllByRole("link", {
    name: "Cổng quản lý nội bộ",
  });
  // Một lần ở Gần đây và một lần ở mục con của Dự án.
  expect(recent.length).toBeGreaterThanOrEqual(1);
  expect(recent[0].getAttribute("href")).toBe("/projects/p-main");
  expect(
    within(sidebar)
      .getByRole("link", { name: "Thiết kế luồng giao việc" })
      .getAttribute("href"),
  ).toBe("/tasks/t-3");
});
