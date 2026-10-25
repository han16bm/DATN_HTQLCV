// @vitest-environment jsdom
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/page";
import { ReportsPage } from "@/features/reports/components/reports-page";
import { UsersPage } from "@/features/users/components/users-page";
import { UserEditorPage } from "@/features/users/components/user-editor-page";
import { MemberProfilePage } from "@/features/users/components/member-profile-page";
import { ReviewsPage } from "@/features/submissions/components/reviews-page";
import { OrganizationPage } from "@/features/organization/components/organization-page";
import { UnitEditorPage } from "@/features/organization/components/unit-editor-page";
import { TeamEditorPage } from "@/features/organization/components/team-editor-page";
import { TeamsPage } from "@/features/organization/components/teams-page";
import { ProfilePage } from "@/features/auth/components/profile-page";
import { analyticsService } from "@/features/analytics/api/analytics.service";
import { AnalysisDetailPage } from "@/features/analytics/components/analysis-detail-page";
import { RisksPage } from "@/features/analytics/components/risks-page";
import { EvidenceUploader } from "@/features/attachments/components/evidence";
import { authService } from "@/features/auth/api/auth.service";
import { authKeys } from "@/features/auth/api/auth.keys";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { reportsService } from "@/features/reports/api/reports.service";
import { ReportPage } from "@/features/reports/components/report-page";
import { SubmitResultDialog } from "@/features/submissions/components/submit-result-dialog";
import { ReviewForm } from "@/features/submissions/components/review-form";
import { SubmissionDetailPage } from "@/features/submissions/components/submission-detail-page";
import { TaskHistoryPage } from "@/features/tasks/components/task-history-page";
import { TaskDetailPage } from "@/features/tasks/components/task-detail-page";
import { TaskListPage } from "@/features/tasks/components/task-list-page";
import { TaskShell } from "@/features/tasks/components/task-shell";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { TaskEditorPage } from "@/features/tasks/components/task-editor-page";
import { ProjectShell } from "@/features/projects/components/project-shell";
import { WorkspaceOverview } from "@/features/projects/components/workspace-overview";
import {
  useGetTaskQuery,
  useListTasksQuery,
} from "@/features/tasks/hooks/use-tasks-queries";
import type { TaskQuery } from "@/features/tasks/types/tasks.types";
import { dateTime } from "@/lib/format";
import { Session } from "@/lib/auth/session-context";
import { db } from "@/mocks/db";
import { resetMockState, server } from "@/mocks/node";
import { registerRefresh, token } from "@/services/api-client";
import { useUI } from "@/stores/ui-store";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { webcrypto } from "node:crypto";
import { StrictMode, type ReactNode } from "react";
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
  vi.stubGlobal("crypto", webcrypto);
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
beforeEach(() => {
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
  vi.unstubAllEnvs();
  cleanup();
  for (const client of clients) client.clear();
  clients.length = 0;
});
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });
it("shows loading feedback before listing actual start dates from the task response", async () => {
  const session = await login("minh");
  const result = await tasksService.listTasks();
  vi.stubEnv("NEXT_PUBLIC_MSW_DELAY", "80");
  show(
    <WorkspaceShell>
      <TaskListPage />
    </WorkspaceShell>,
    session,
  );
  expect(screen.getByRole("status", { name: "Đang tải dữ liệu" })).toBeTruthy();
  await screen.findByRole("status", { name: "Đang cập nhật dữ liệu" });
  await screen.findByRole("columnheader", { name: "Ngày bắt đầu" });
  const table = screen.getByRole("table");
  const column = within(table)
    .getAllByRole("columnheader")
    .findIndex((header) => header.textContent === "Ngày bắt đầu");
  for (const id of ["t-2", "t-3"]) {
    const task = result.items.find((item) => item.id === id)!;
    const row = within(table)
      .getByRole("link", { name: `Xem công việc ${task.title}` })
      .closest("tr")!;
    expect(within(row).getAllByRole("cell")[column].textContent).toBe(
      task.firstStartedAt ? dateTime(task.firstStartedAt) : "Chưa bắt đầu",
    );
  }
  expect(screen.queryByRole("status", { name: "Đang tải dữ liệu" })).toBeNull();
});
it("shows creation and actual first-start dates in task details", async () => {
  const session = await login("lan");
  const task = await tasksService.getTask("t-2");
  const client = show(<TaskDetailPage taskId={task.id} />, session);
  expect(
    (await screen.findByText("Ngày tạo")).nextElementSibling?.textContent,
  ).toBe(dateTime(task.createdAt));
  expect(
    screen.getByText("Bắt đầu thực hiện").nextElementSibling?.textContent,
  ).toBe("Chưa bắt đầu");
  const started = await tasksService.startTask(task.id, {
    version: task.version,
    key: "show-start-date",
  });
  await act(async () => {
    await client.invalidateQueries({ queryKey: tasksKeys.all });
  });
  await waitFor(() =>
    expect(
      screen.getByText("Bắt đầu thực hiện").nextElementSibling?.textContent,
    ).toBe(dateTime(started.firstStartedAt)),
  );
});
it("shows only a colleague's identity and email in the member profile", async () => {
  const session = await login("lan");
  show(<MemberProfilePage userId="u-pm" />, session);
  await screen.findByRole("heading", { name: "Nguyễn Minh" });
  expect(screen.getByText("Phòng sản phẩm")).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Thông tin liên hệ" }),
  ).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "minh@example.test" })
      .getAttribute("href"),
  ).toBe("mailto:minh@example.test");
  expect(screen.queryByRole("table")).toBeNull();
  expect(
    screen.queryByRole("region", { name: "Hoạt động công việc" }),
  ).toBeNull();
  expect(screen.queryByText("Dự án tham gia")).toBeNull();
  expect(screen.queryByText("Đã hoàn thành")).toBeNull();
  expect(screen.queryByText("Tên đăng nhập")).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByRole("link", { name: "Quản lý hồ sơ" })).toBeNull();
});
it("links the member's own profile to settings and shows unavailable profiles as a page error", async () => {
  const session = await login("lan");
  show(<MemberProfilePage userId="u-lan" />, session);
  expect(
    (await screen.findByRole("link", { name: "Quản lý hồ sơ" })).getAttribute(
      "href",
    ),
  ).toBe("/profile");
  expect(screen.getByRole("link", { name: "lan@example.test" })).toBeTruthy();
  cleanup();
  show(<MemberProfilePage userId="u-locked" />, session);
  expect(
    await screen.findByRole("heading", { name: "Không tìm thấy nội dung" }),
  ).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
});
it("keeps admin account information and access actions together without exposing internal IDs", async () => {
  const session = await login("admin");
  show(<UserEditorPage userId="u-admin" />, session);
  await screen.findByRole("heading", { name: "Thông tin tài khoản" });
  expect(screen.getByText("admin@example.test")).toBeTruthy();
  expect(screen.queryByText(/Mã tài khoản/)).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.getByRole("button", { name: "Khóa tài khoản" })).toBeTruthy();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Chỉnh sửa thông tin" }));
  expect(screen.getByRole("textbox", { name: "Họ tên *" })).toHaveProperty(
    "value",
    session.user.displayName,
  );
});
it("edits the signed-in profile through HTTP and immediately updates the avatar menu", async () => {
  const session = await login("lan");
  show(
    <WorkspaceShell>
      <ProfilePage />
    </WorkspaceShell>,
    session,
  );
  expect(screen.getByRole("textbox", { name: "Email" })).toHaveProperty(
    "readOnly",
    true,
  );
  const user = userEvent.setup();
  expect(
    screen
      .getByRole("link", { name: "Xem hồ sơ công khai" })
      .getAttribute("href"),
  ).toBe("/users/u-lan");
  const name = screen.getByRole("textbox", { name: "Họ tên *" });
  await user.clear(name);
  await user.type(name, "Lan Nguyễn");
  const username = screen.getByRole("textbox", { name: "Tên đăng nhập *" });
  await user.clear(username);
  await user.type(username, "lan.profile");
  vi.stubEnv("NEXT_PUBLIC_MSW_DELAY", "80");
  await user.click(screen.getByRole("button", { name: "Lưu hồ sơ" }));
  expect(
    screen.getByRole("button", { name: "Đang lưu…" }).matches(":disabled"),
  ).toBe(true);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Lưu hồ sơ" }).matches(":disabled"),
    ).toBe(false),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Mở menu tài khoản" }).textContent,
    ).toContain("Lan Nguyễn"),
  );
  expect(
    screen.getByRole("textbox", { name: "Tên đăng nhập *" }),
  ).toHaveProperty("value", "lan.profile");
  expect((await authService.getSession()).user).toMatchObject({
    displayName: "Lan Nguyễn",
    username: "lan.profile",
    email: session.user.email,
  });
  await user.clear(name);
  await user.type(name, "Lan Trần");
  await user.click(screen.getByRole("button", { name: "Lưu hồ sơ" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Lưu hồ sơ" }).matches(":disabled"),
    ).toBe(false),
  );
  expect((await authService.getSession()).user).toMatchObject({
    displayName: "Lan Trần",
    version: session.user.version + 2,
  });
});
it("uploads the selected avatar with the profile and renders the returned image URL", async () => {
  const session = await login("admin");
  show(
    <WorkspaceShell>
      <ProfilePage />
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Ảnh đại diện" }));
  const file = new File(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])],
    "avatar.png",
    { type: "image/png" },
  );
  await user.upload(screen.getByLabelText("Chọn ảnh"), file);
  expect(screen.getByText("avatar.png")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Cập nhật ảnh" }));
  await screen.findByRole("button", { name: "Lưu hồ sơ" });
  const updated = await authService.getSession();
  expect(updated.user.avatarUrl).toBeTruthy();
  const src = screen
    .getByRole("button", { name: "Mở menu tài khoản" })
    .querySelector("img")
    ?.getAttribute("src");
  expect(src).toBeTruthy();
  expect(new URL(src!, location.origin).pathname).toBe(updated.user.avatarUrl);
});
it("retains a profile draft through a version conflict and saves after comparison", async () => {
  const session = await login("lan");
  show(<ProfilePage />, session);
  const user = userEvent.setup();
  const name = screen.getByRole("textbox", { name: "Họ tên *" });
  await user.clear(name);
  await user.type(name, "Bản đang sửa");
  await authService.updateProfile(
    { username: session.user.username, displayName: "Bản mới nhất" },
    { key: crypto.randomUUID(), version: session.user.version },
  );
  await user.click(screen.getByRole("button", { name: "Lưu hồ sơ" }));
  await user.click(
    await screen.findByRole("button", { name: "Tải bản mới để đối chiếu" }),
  );
  await screen.findAllByText("Bản mới nhất");
  expect(name).toHaveProperty("value", "Bản đang sửa");
  await user.click(
    screen.getByRole("button", { name: "Đã đối chiếu, tiếp tục chỉnh sửa" }),
  );
  await user.click(screen.getByRole("button", { name: "Lưu hồ sơ" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Lưu hồ sơ" }).matches(":disabled"),
    ).toBe(false),
  );
  expect((await authService.getSession()).user.displayName).toBe(
    "Bản đang sửa",
  );
});
it("explains an oversized avatar and asks before discarding the selected file", async () => {
  const session = await login("lan");
  show(<ProfilePage />, session);
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Ảnh đại diện" }));
  await user.upload(
    screen.getByLabelText("Chọn ảnh"),
    new File([new Uint8Array(2 * 1024 ** 2 + 1)], "large.png", {
      type: "image/png",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Cập nhật ảnh" }));
  await screen.findByText("Ảnh không được vượt quá 2 MB.");
  expect((await authService.getSession()).user.version).toBe(
    session.user.version,
  );
  await user.click(screen.getByRole("tab", { name: "Thông tin cá nhân" }));
  const dialog = await screen.findByRole("alertdialog");
  await user.click(within(dialog).getByRole("button", { name: "Ở lại" }));
  expect(screen.getByLabelText("Chọn ảnh")).toHaveProperty("files.length", 1);
  expect(
    screen
      .getByRole("tab", { name: "Ảnh đại diện" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  await user.click(screen.getByRole("tab", { name: "Thông tin cá nhân" }));
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Bỏ thay đổi",
    }),
  );
  await screen.findByRole("button", { name: "Lưu hồ sơ" });
});
it("changes the password in its own profile section and keeps credentials out of mutation state", async () => {
  const session = await login("lan");
  const client = show(<ProfilePage />, session);
  expect(screen.queryByLabelText("Mật khẩu hiện tại *")).toBeNull();
  const user = userEvent.setup();
  screen.getByRole("tab", { name: "Thông tin cá nhân" }).focus();
  await user.keyboard("{End}");
  expect(document.activeElement).toBe(
    screen.getByRole("tab", { name: "Đổi mật khẩu" }),
  );
  await user.keyboard("{Enter}");
  expect(screen.getByRole("tabpanel", { name: "Đổi mật khẩu" })).toBeTruthy();
  const current = screen.getByLabelText("Mật khẩu hiện tại *");
  const next = screen.getByLabelText("Mật khẩu mới *");
  const confirm = screen.getByLabelText("Nhập lại mật khẩu mới *");
  expect(current.getAttribute("autocomplete")).toBe("current-password");
  await user.type(current, "Wrong@12345");
  await user.type(next, "NewPrivate@12345");
  await user.type(confirm, "Mismatch@12345");
  await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));
  await screen.findByText("Mật khẩu nhập lại không khớp.");
  await user.clear(confirm);
  await user.type(confirm, "NewPrivate@12345");
  await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));
  await screen.findAllByText("Mật khẩu hiện tại chưa đúng.");
  expect(next).toHaveProperty("value", "NewPrivate@12345");
  await user.clear(current);
  await user.type(current, "Mock@12345");
  await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));
  await screen.findByRole("button", { name: "Lưu hồ sơ" });
  expect(screen.queryByLabelText("Mật khẩu mới *")).toBeNull();
  const states = JSON.stringify(
    client
      .getMutationCache()
      .getAll()
      .map((mutation) => mutation.state),
  );
  expect(states).not.toContain("NewPrivate@12345");
  expect(states).not.toContain("Wrong@12345");
  expect(
    (await authService.login({ username: "lan", password: "NewPrivate@12345" }))
      .user.id,
  ).toBe(session.user.id);
});
it.each([
  ["lan", 3],
  ["minh", 4],
] as const)(
  "shows personal overview counts and relevant cards for %s",
  async (username, count) => {
    const session = await login(username);
    const expected = await tasksService.listTasks({
      assigneeId: session.user.id,
      overdue: true,
      pageSize: 1,
    });
    show(<WorkspaceOverview />, session);
    const stats = screen.getByRole("region", { name: "Số liệu cá nhân" });
    expect(within(stats).getAllByRole("link")).toHaveLength(count);
    const overdue = within(stats).getByRole("link", {
      name: /^Công việc quá hạn/,
    });
    await within(overdue).findByText(String(expected.pagination.total));
    expect(overdue.getAttribute("href")).toBe(
      `/tasks?overdue=true&assigneeId=${session.user.id}`,
    );
    expect(
      Boolean(within(stats).queryByRole("link", { name: /^Chờ nghiệm thu/ })),
    ).toBe(username === "minh");
    const draft = within(stats).getByRole("link", { name: /^Báo cáo nháp/ });
    expect(draft.getAttribute("href")).toContain(`authorId=${session.user.id}`);
    await screen.findByRole("columnheader", { name: "Hành động" });
  },
);
it("prompts for the unit by name and blocks account creation when it is unselected", async () => {
  const session = await login("admin");
  const count = db.users.length;
  show(<UserEditorPage />, session);
  const user = userEvent.setup();
  const unit = await screen.findByRole("combobox", { name: "Đơn vị *" });
  await user.selectOptions(unit, "");
  await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
  await screen.findByText("Vui lòng chọn đơn vị.");
  expect(unit.getAttribute("aria-invalid")).toBe("true");
  expect(screen.queryByText("Thiếu mã tài nguyên.")).toBeNull();
  expect(db.users).toHaveLength(count);
});
it("switches analytics sections through a dropdown while preserving the selected scope", async () => {
  const session = await login("minh");
  history.replaceState(
    null,
    "",
    "/analytics/risks?unitId=unit-product&projectId=p-main&from=2026-10-01&to=2026-10-23",
  );
  show(<RisksPage />, session);
  const selector = screen.getByRole("combobox", { name: "Mục phân tích" });
  expect(selector).toHaveProperty("value", "/analytics/risks");
  expect(screen.queryByRole("navigation", { name: "Mục nội dung" })).toBeNull();
  expect(
    screen.queryByText(
      "Theo dõi số liệu và căn cứ trong phạm vi được cấp quyền.",
    ),
  ).toBeNull();
  expect(screen.queryByRole("combobox", { name: "Đơn vị" })).toBeNull();
  await userEvent.setup().selectOptions(selector, "/analytics/workload");
  const target = new URL(
    nav.push.mock.calls.at(-1)![0] as string,
    location.origin,
  );
  expect(target.pathname).toBe("/analytics/workload");
  expect(Object.fromEntries(target.searchParams)).toEqual({
    unitId: "unit-product",
    projectId: "p-main",
    from: "2026-10-01",
    to: "2026-10-23",
  });
});
it("opens collapsed analytics filters, clears dependent selections, resets and returns focus after Escape", async () => {
  const session = await login("minh");
  history.replaceState(
    null,
    "",
    "/analytics/risks?unitId=unit-product&projectId=p-main&teamId=team-main&assigneeId=u-lan&status=IN_PROGRESS&from=2026-10-01&to=2026-10-23",
  );
  show(<RisksPage />, session);
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name: "Bộ lọc" });
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(trigger);
  const popup = await screen.findByRole("dialog", { name: "Bộ lọc phân tích" });
  const unit = within(popup).getByRole("combobox", { name: "Đơn vị" });
  await within(popup).findByRole("option", { name: "Phòng sản phẩm" });
  await user.selectOptions(unit, "");
  let target = new URL(
    nav.replace.mock.calls.at(-1)![0] as string,
    location.origin,
  );
  expect(Object.fromEntries(target.searchParams)).toEqual({
    status: "IN_PROGRESS",
    from: "2026-10-01",
    to: "2026-10-23",
  });
  await user.click(within(popup).getByRole("button", { name: "Đặt lại" }));
  target = new URL(
    nav.replace.mock.calls.at(-1)![0] as string,
    location.origin,
  );
  expect([...target.searchParams]).toEqual([]);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(trigger);
});
it("keeps the table, title, empty state and pagination inside one shared card", async () => {
  const onPage = vi.fn();
  const props = {
    title: "Danh sách",
    headers: ["Tên"],
    rows: [["Dòng dữ liệu"]],
  };
  const view = render(
    <DataTable
      {...props}
      pagination={{ page: 1, pageSize: 20, total: 6, onPage }}
    />,
  );
  const card = screen
    .getByRole("table", { name: "Danh sách" })
    .closest("section")!;
  expect(within(card).getByRole("heading", { name: "Danh sách" })).toBeTruthy();
  expect(within(card).getByText("6 kết quả")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Phân trang" })).toBeNull();
  view.rerender(
    <DataTable
      {...props}
      pagination={{ page: 2, pageSize: 20, total: 41, onPage }}
    />,
  );
  expect(
    within(card).getByRole("navigation", { name: "Phân trang" }),
  ).toBeTruthy();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Sau" }));
  expect(onPage).toHaveBeenLastCalledWith(3);
  await user.click(screen.getByRole("button", { name: "Trước" }));
  expect(onPage).toHaveBeenLastCalledWith(1);
  view.rerender(<DataTable {...props} rows={[]} />);
  expect(within(card).getByText("Chưa có dữ liệu")).toBeTruthy();
  expect(within(card).getByText("0 kết quả")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Phân trang" })).toBeNull();
});
it("shows report projects in their own column and puts the detail link in the last cell", async () => {
  const session = await login("minh");
  show(<ReportsPage />, session);
  const report = await screen.findByText("Hằng ngày · 2026-10-22");
  const row = report.closest("tr")!;
  const card = row.closest("section")!;
  expect(within(card).getByText(/^\d+ kết quả$/)).toBeTruthy();
  expect(screen.getAllByText(/^\d+ kết quả$/)).toHaveLength(1);
  const cells = within(row).getAllByRole("cell");
  expect(cells[0].textContent).toBe("Hằng ngày · 2026-10-22");
  expect(cells[1].textContent).toBe("Cổng quản lý nội bộ");
  const link = within(cells.at(-1)!).getByRole("link", {
    name: "Xem báo cáo 2026-10-22",
  });
  expect(link.getAttribute("href")).toBe("/reports/r-submitted");
  expect(screen.queryByRole("navigation", { name: "Phân trang" })).toBeNull();
});
it("links user names to member profiles and keeps the admin action at the end of the row", async () => {
  const session = await login("admin");
  show(<UsersPage />, session);
  const row = (await screen.findByText("Trần Lan")).closest("tr")!;
  expect(within(row).getByText("lan@example.test · lan")).toBeTruthy();
  expect(row.querySelector('[aria-hidden="true"]')?.textContent).toBe("TL");
  const cells = within(row).getAllByRole("cell");
  const link = within(cells.at(-1)!).getByRole("link", {
    name: "Xem hồ sơ Trần Lan",
  });
  expect(link.getAttribute("href")).toBe("/admin/users/u-lan");
  expect(
    within(cells[0])
      .getByRole("link", { name: "Xem hồ sơ công khai của Trần Lan" })
      .getAttribute("href"),
  ).toBe("/users/u-lan");
});
it("shows review task titles from the queue response without fetching every task again", async () => {
  const session = await login("minh");
  const requests: string[] = [];
  const observe = ({ request }: { request: Request }) =>
    requests.push(new URL(request.url).pathname);
  server.events.on("request:start", observe);
  try {
    show(<ReviewsPage />, session);
    const row = (await screen.findByText("API báo cáo tuần")).closest("tr")!;
    const cells = within(row).getAllByRole("cell");
    expect(
      within(cells.at(-1)!)
        .getByRole("link", { name: "Xem lần nộp 1" })
        .getAttribute("href"),
    ).toBe("/tasks/t-4/submissions/s-pending");
    expect(requests.filter((path) => path.startsWith("/api/tasks/"))).toEqual(
      [],
    );
  } finally {
    server.events.removeListener("request:start", observe);
  }
});
it("groups navigation, keeps nested routes active and preserves links when the sidebar is collapsed", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/projects/p-main/edit");
  show(
    <WorkspaceShell>
      <p>Nội dung dự án</p>
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  expect(
    screen.getByRole("link", { name: "Dự án" }).getAttribute("aria-current"),
  ).toBe("page");
  expect(
    screen.queryByRole("link", { name: "Tài khoản người dùng" }),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: "Công việc" }));
  expect(screen.queryByRole("link", { name: "Dự án" })).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Thu gọn thanh điều hướng" }),
  );
  expect(
    screen.getByRole("button", { name: "Mở rộng thanh điều hướng" }),
  ).toBeTruthy();
  expect(screen.getByRole("link", { name: "Dự án" })).toBeTruthy();
  act(() => useUI.getState().markDirty("navigation-test", true));
  await user.click(screen.getByRole("link", { name: "Công việc" }));
  const confirm = await screen.findByRole("alertdialog", {
    name: "Thay đổi chưa được lưu",
  });
  expect(confirm.className).toBe("confirm-content");
  expect(document.activeElement).toBe(
    within(confirm).getByRole("button", { name: "Ở lại" }),
  );
  await user.click(within(confirm).getByRole("button", { name: "Ở lại" }));
  expect(useUI.getState().dirtyForms).toEqual(["navigation-test"]);
  expect(nav.push).not.toHaveBeenCalled();
  await user.click(screen.getByRole("link", { name: "Công việc" }));
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Bỏ thay đổi",
    }),
  );
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/tasks"));
  expect(useUI.getState().dirtyForms).toEqual([]);
  expect(useUI.getState().sidebarCollapsed).toBe(true);
  await user.click(
    screen.getByRole("button", { name: "Mở rộng thanh điều hướng" }),
  );
  expect(screen.queryByRole("link", { name: "Dự án" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Công việc" }));
  expect(screen.getByRole("link", { name: "Dự án" })).toBeTruthy();
});
it("opens an accessible mobile menu, filters permissions and restores focus after Escape", async () => {
  const session = await login("lan");
  show(
    <WorkspaceShell>
      <p>Nội dung công việc</p>
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name: "Mở menu" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Menu điều hướng" });
  expect(within(dialog).getByRole("link", { name: "Công việc" })).toBeTruthy();
  expect(
    within(dialog).queryByRole("link", { name: "Phân tích & AI" }),
  ).toBeNull();
  expect(
    within(dialog).queryByRole("link", { name: "Tài khoản người dùng" }),
  ).toBeNull();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(trigger);
  await user.click(trigger);
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", {
      name: "Đóng menu",
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
it("keeps account actions in the avatar menu and shows the signed-in profile", async () => {
  const session = await login("admin");
  show(
    <WorkspaceShell>
      <ProfilePage />
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  const sidebar = screen.getByRole("complementary", {
    name: "Thanh điều hướng",
  });
  expect(within(sidebar).queryByText("Đăng xuất")).toBeNull();
  expect(
    within(sidebar).getByRole("link", { name: "Bảng tổng quan" }),
  ).toBeTruthy();
  expect(screen.getByText("admin@example.test")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Mở menu tài khoản" }));
  const menu = await screen.findByRole("menu");
  expect(
    within(menu)
      .getByRole("menuitem", { name: "Hồ sơ công khai" })
      .getAttribute("href"),
  ).toBe("/users/u-admin");
  expect(
    within(menu)
      .getByRole("menuitem", { name: "Hồ sơ cá nhân" })
      .getAttribute("href"),
  ).toBe("/profile");
  expect(
    within(menu).getByRole("menuitem", { name: "Đăng xuất" }),
  ).toBeTruthy();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
});
it("preserves an unsaved form when cancelling a mode switch and applies the selected mode after confirmation", async () => {
  const session = await login("minh");
  show(
    <ReviewForm taskId="t-4" submissionId="s-pending" version={1} />,
    session,
  );
  const user = userEvent.setup();
  expect(screen.queryByRole("textbox")).toBeNull();
  await user.click(
    screen.getByRole("button", { name: "Đưa ra quyết định nghiệm thu" }),
  );
  await user.type(
    screen.getByRole("textbox", { name: "Nhận xét" }),
    "Cần xem lại kết quả",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Quyết định" }),
    "REVISION",
  );
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ở lại",
    }),
  );
  expect(screen.getByRole("textbox", { name: "Nhận xét" })).toHaveProperty(
    "value",
    "Cần xem lại kết quả",
  );
  expect(screen.getByRole("combobox", { name: "Quyết định" })).toHaveProperty(
    "value",
    "APPROVE",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Quyết định" }),
    "REVISION",
  );
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Bỏ thay đổi",
    }),
  );
  await screen.findByRole("textbox", { name: "Lý do yêu cầu sửa *" });
  expect(screen.getByRole("combobox", { name: "Quyết định" })).toHaveProperty(
    "value",
    "REVISION",
  );
  expect(screen.queryByRole("textbox", { name: "Nhận xét" })).toBeNull();
  expect(useUI.getState().dirtyForms).toEqual([]);
});
it("selects submissions on a nested submission detail route", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-4/submissions/s-pending");
  show(
    <TaskShell taskId="t-4">
      <p>Chi tiết lần nộp</p>
    </TaskShell>,
    session,
  );
  const select = await screen.findByRole("combobox", { name: "Mục công việc" });
  expect(select).toHaveProperty("value", "/tasks/t-4/submissions");
  expect(screen.queryByRole("link", { name: "Các lần nộp" })).toBeNull();
});
it("selects project history from the URL and keeps permission-dependent navigation scoped", async () => {
  const session = await login("admin");
  history.replaceState(null, "", "/projects/p-main?tab=history&page=2");
  show(
    <ProjectShell projectId="p-main">
      <p>Nội dung dự án</p>
    </ProjectShell>,
    session,
  );
  const select = await screen.findByRole("combobox", { name: "Mục dự án" });
  expect(select).toHaveProperty("value", "/projects/p-main?tab=history");
  expect(
    within(select).queryByRole("option", { name: "Phân quyền" }),
  ).toBeNull();
  expect(screen.queryByRole("link", { name: "Tổng quan" })).toBeNull();
  expect(screen.queryByText(/Kế hoạch dự án/)).toBeNull();
  await userEvent.setup().selectOptions(select, "/tasks?projectId=p-main");
  expect(nav.push).toHaveBeenCalledWith("/tasks?projectId=p-main");
});
it("keeps a task edit draft when cancelling dropdown navigation and leaves only after confirmation", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-3/edit");
  show(
    <TaskShell taskId="t-3">
      <TaskEditorPage taskId="t-3" />
    </TaskShell>,
    session,
  );
  const select = await screen.findByRole("combobox", { name: "Mục công việc" });
  expect(select).toHaveProperty("value", "/tasks/t-3/edit");
  const input = await screen.findByRole("textbox", { name: "Tên công việc *" });
  const user = userEvent.setup();
  await user.clear(input);
  await user.type(input, "Công việc đang sửa");
  await user.selectOptions(select, "/tasks/t-3/history");
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ở lại",
    }),
  );
  expect(nav.push).not.toHaveBeenCalled();
  expect(select).toHaveProperty("value", "/tasks/t-3/edit");
  expect(input).toHaveProperty("value", "Công việc đang sửa");
  await user.selectOptions(select, "/tasks/t-3/history");
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Bỏ thay đổi",
    }),
  );
  expect(nav.push).toHaveBeenCalledWith("/tasks/t-3/history");
  expect(db.tasks.find((task) => task.id === "t-3")?.title).not.toBe(
    "Công việc đang sửa",
  );
});
it("opens a review only on request and approves the current submission through HTTP", async () => {
  const session = await login("minh");
  show(<SubmissionDetailPage taskId="t-4" submissionId="s-pending" />, session);
  const user = userEvent.setup();
  const open = await screen.findByRole("button", {
    name: "Đưa ra quyết định nghiệm thu",
  });
  expect(screen.queryByRole("textbox")).toBeNull();
  await user.click(open);
  await user.type(
    screen.getByRole("textbox", { name: "Nhận xét" }),
    "Đạt các tiêu chí nghiệm thu",
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận quyết định" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/tasks/t-4"));
  expect(db.submissions.find((item) => item.id === "s-pending")?.status).toBe(
    "ACCEPTED",
  );
  expect(db.tasks.find((item) => item.id === "t-4")?.status).toBe("COMPLETED");
});
it.each(["admin", "huy"])(
  "keeps the review action hidden for %s without eligible review access",
  async (username) => {
    const session = await login(username);
    show(
      <SubmissionDetailPage taskId="t-4" submissionId="s-pending" />,
      session,
    );
    await screen.findByText("Đã hoàn thiện API báo cáo");
    expect(
      screen.queryByRole("button", { name: "Đưa ra quyết định nghiệm thu" }),
    ).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  },
);
it.each([
  {
    search: "status=TODO",
    selected: "TODO",
    next: "OVERDUE",
    expected: { overdue: "true" },
  },
  {
    search: "overdue=true",
    selected: "OVERDUE",
    next: "IN_PROGRESS",
    expected: { status: "IN_PROGRESS" },
  },
])(
  "maps the status selection to HTTP filters for $search without sending OVERDUE as a workflow state",
  async ({ search, selected, next, expected }) => {
    const session = await login("minh");
    history.replaceState(null, "", `/tasks?projectId=p-main&${search}&page=2`);
    const requests: URL[] = [];
    const observe = ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      if (url.pathname === "/api/tasks") requests.push(url);
    };
    server.events.on("request:start", observe);
    try {
      show(<TaskListPage />, session);
      const status = screen.getByRole("combobox", { name: "Trạng thái" });
      expect(status).toHaveProperty("value", selected);
      expect(
        screen.queryByRole("checkbox", { name: "Chỉ việc quá hạn" }),
      ).toBeNull();
      await waitFor(() => expect(requests).toHaveLength(1));
      expect(requests[0].searchParams.get("status")).not.toBe("OVERDUE");
      if (selected === "OVERDUE")
        expect(requests[0].searchParams.get("overdue")).toBe("true");
      await userEvent.setup().selectOptions(status, next);
      const target = new URL(
        nav.replace.mock.calls.at(-1)![0] as string,
        location.origin,
      );
      expect(Object.fromEntries(target.searchParams)).toEqual({
        projectId: "p-main",
        ...expected,
      });
    } finally {
      server.events.removeListener("request:start", observe);
    }
  },
);
it("renders translated task history and real before/after values without raw JSON", async () => {
  const session = await login("minh");
  const task = await tasksService.getTask("t-3");
  await tasksService.updateTask(
    task.id,
    { description: "Mô tả được cập nhật", priority: "HIGH" },
    { version: task.version, key: "history-view-update" },
  );
  show(<TaskHistoryPage taskId={task.id} />, session);
  const row = (await screen.findByText("Điều chỉnh công việc")).closest("tr")!;
  expect(within(row).getByText("Nguyễn Minh")).toBeTruthy();
  await userEvent.setup().click(within(row).getByText(/^Xem thay đổi/));
  expect(within(row).getByText("Mô tả")).toBeTruthy();
  expect(within(row).getByText("Mô tả được cập nhật")).toBeTruthy();
  expect(within(row).getByText("Cao")).toBeTruthy();
  expect(within(row).queryByText('"before"')).toBeNull();
  expect(row.querySelector("pre")).toBeNull();
});
it.each([
  [
    "units",
    "/admin/organization",
    "Danh sách đơn vị",
    "Phòng sản phẩm",
    "/admin/organization/unit-product",
  ],
  [
    "teams",
    "/admin/teams",
    "Danh sách nhóm",
    "Nhóm phát triển",
    "/admin/teams/team-main",
  ],
] as const)(
  "shows a %s list with detail actions without loading editors or people",
  async (resource, path, title, name, target) => {
    const session = await login("admin");
    history.replaceState(null, "", path);
    const paths: string[] = [];
    const observe = ({ request }: { request: Request }) =>
      paths.push(new URL(request.url).pathname);
    server.events.on("request:start", observe);
    try {
      show(
        resource === "units" ? <OrganizationPage /> : <TeamsPage />,
        session,
      );
      const table = await screen.findByRole("table", { name: title });
      const row = within(table).getByText(name).closest("tr")!;
      expect(
        within(table).getByRole("columnheader", { name: "Hành động" }),
      ).toBeTruthy();
      expect(
        within(row)
          .getByRole("link", {
            name: `Xem ${resource === "units" ? "đơn vị" : "nhóm"} ${name}`,
          })
          .getAttribute("href"),
      ).toBe(target);
      expect(
        screen.queryByRole("button", {
          name: /Chỉnh sửa|Chọn thành viên|Ngừng sử dụng/,
        }),
      ).toBeNull();
      expect(screen.queryByRole("textbox")).toBeNull();
      expect(paths).toEqual([`/api/${resource}`]);
      expect(
        within(table.closest("section")!).getByText(/^\d+ kết quả$/),
      ).toBeTruthy();
      expect(
        screen
          .getByRole("link", {
            name: resource === "units" ? "Thêm đơn vị" : "Tạo nhóm",
          })
          .getAttribute("href"),
      ).toBe(`${path}/new`);
    } finally {
      server.events.removeListener("request:start", observe);
    }
  },
);
it("shows unit details on their own route and opens editing on demand", async () => {
  const session = await login("admin");
  history.replaceState(null, "", "/admin/organization/unit-product");
  show(<UnitEditorPage unitId="unit-product" />, session);
  const user = userEvent.setup();
  const edit = await screen.findByRole("button", { name: "Chỉnh sửa" });
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Danh sách đơn vị" }).getAttribute("href"),
  ).toBe("/admin/organization");
  const close = screen.getByRole("button", { name: "Ngừng sử dụng đơn vị" });
  expect(edit.parentElement).toBe(close.parentElement);
  await user.click(edit);
  expect(
    screen.queryByRole("button", { name: "Ngừng sử dụng đơn vị" }),
  ).toBeNull();
  const name = screen.getByRole("textbox", { name: "Tên đơn vị *" });
  await user.clear(name);
  await user.type(name, "Phòng sản phẩm mới");
  await user.click(screen.getByRole("button", { name: "Hủy" }));
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ở lại",
    }),
  );
  expect(name).toHaveProperty("value", "Phòng sản phẩm mới");
  await user.type(
    screen.getByRole("textbox", { name: "Lý do thay đổi *" }),
    "Điều chỉnh cơ cấu",
  );
  await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  await screen.findByRole("button", { name: "Chỉnh sửa" });
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(db.units.find((unit) => unit.id === "unit-product")).toMatchObject({
    name: "Phòng sản phẩm mới",
    version: 2,
  });
  expect(useUI.getState().dirtyForms).toEqual([]);
});
it("creates a unit from its own page through HTTP", async () => {
  const session = await login("admin");
  show(<UnitEditorPage />, session);
  const user = userEvent.setup();
  await user.type(
    await screen.findByRole("textbox", { name: "Tên đơn vị *" }),
    "Phòng vận hành",
  );
  await user.click(screen.getByRole("button", { name: "Thêm đơn vị" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalled());
  const unit = db.units.find((unit) => unit.name === "Phòng vận hành")!;
  expect(unit.status).toBe("ACTIVE");
  expect(nav.push).toHaveBeenCalledWith(
    `/admin/organization/${encodeURIComponent(unit.id)}`,
  );
});
it("edits team members inside one card with a searchable selection box", async () => {
  const session = await login("admin");
  history.replaceState(null, "", "/admin/teams/team-main");
  show(<TeamEditorPage teamId="team-main" />, session);
  const user = userEvent.setup();
  const edit = await screen.findByRole("button", { name: "Chọn thành viên" });
  expect(document.querySelectorAll(".panel")).toHaveLength(1);
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByRole("checkbox")).toBeNull();
  await user.click(edit);
  expect(screen.queryByRole("checkbox")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Thành viên" }));
  const box = await screen.findByRole("dialog", { name: "Chọn thành viên" });
  const search = within(box).getByRole("textbox", { name: "Tìm thành viên" });
  await user.type(search, "Huy");
  expect(within(box).queryByRole("checkbox", { name: "Trần Lan" })).toBeNull();
  await user.click(within(box).getByRole("checkbox", { name: "Nguyễn Huy" }));
  await user.click(within(box).getByRole("button", { name: "Xong" }));
  await user.type(
    screen.getByRole("textbox", { name: "Lý do thay đổi thành viên *" }),
    "Điều chuyển công việc",
  );
  await user.click(screen.getByRole("button", { name: "Lưu thành viên" }));
  await screen.findByRole("button", { name: "Chọn thành viên" });
  expect(db.teams.find((team) => team.id === "team-main")).toMatchObject({
    memberIds: ["u-lan"],
    version: 2,
  });
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(document.querySelectorAll(".panel")).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Chỉnh sửa thông tin" }));
  await user.type(screen.getByRole("textbox", { name: "Tên nhóm *" }), " mới");
  await user.type(
    screen.getByRole("textbox", { name: "Lý do thay đổi *" }),
    "Đổi tên nhóm",
  );
  await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  await screen.findByRole("button", { name: "Chọn thành viên" });
  expect(db.teams.find((team) => team.id === "team-main")).toMatchObject({
    name: "Nhóm phát triển mới",
    version: 3,
  });
});
it("creates a team from its own page and opens the resulting detail route", async () => {
  const session = await login("admin");
  show(<TeamEditorPage />, session);
  const user = userEvent.setup();
  await user.type(
    await screen.findByRole("textbox", { name: "Tên nhóm *" }),
    "Nhóm vận hành",
  );
  await user.click(screen.getByRole("button", { name: "Tạo nhóm" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalled());
  const team = db.teams.find((team) => team.name === "Nhóm vận hành")!;
  expect(team.status).toBe("ACTIVE");
  expect(nav.push).toHaveBeenCalledWith(
    `/admin/teams/${encodeURIComponent(team.id)}`,
  );
});
it("displays the upload policy from HTTP and rejects oversized files before posting", async () => {
  const session = await login("lan");
  server.use(
    http.get("*/api/attachments/policy", () =>
      HttpResponse.json({
        data: {
          maxBytes: 1024 ** 2,
          maxAttachments: 2,
          allowedMimeTypes: ["text/plain"],
        },
        meta: {
          requestId: "upload-policy",
          serverTime: "2026-10-24T00:00:00.000Z",
        },
      }),
    ),
  );
  let uploads = 0;
  const observe = ({ request }: { request: Request }) => {
    if (
      request.method === "POST" &&
      new URL(request.url).pathname === "/api/attachments"
    )
      uploads++;
  };
  server.events.on("request:start", observe);
  try {
    show(
      <EvidenceUploader
        taskId="t-3"
        onChange={() => {}}
        onBusyChange={() => {}}
      />,
      session,
    );
    await screen.findByText("Tối đa 2 tệp, mỗi tệp 1 MiB. TXT.");
    const input = screen.getByLabelText("Tệp minh chứng");
    expect(input).toHaveProperty("accept", "text/plain");
    await userEvent.setup().upload(
      input,
      new File(["x".repeat(2 * 1024 ** 2)], "large.txt", {
        type: "text/plain",
      }),
    );
    await screen.findByText("Định dạng hoặc dung lượng tệp không hợp lệ.");
    expect(uploads).toBe(0);
  } finally {
    server.events.removeListener("request:start", observe);
  }
});
function show(children: ReactNode, session: SessionDto, strict = false) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  const content = (
    <QueryClientProvider client={client}>
      <TestSession session={session}>
        {children}
        <ConfirmDialog />
      </TestSession>
    </QueryClientProvider>
  );
  render(strict ? <StrictMode>{content}</StrictMode> : content);
  return client;
}
function TestSession({
  session,
  children,
}: {
  session: SessionDto;
  children: ReactNode;
}) {
  const query = useQuery({
    queryKey: authKeys.getSession(session.user.id),
    queryFn: () => authService.getSession(),
    initialData: session,
    staleTime: Infinity,
  });
  return (
    <Session
      value={{
        session: query.data,
        loading: false,
        refresh: query.refetch,
        signIn: async () => {},
        signOut: async () => {},
      }}
    >
      {children}
    </Session>
  );
}
it("shares one cache entry and HTTP request for equivalent normalized task filters", async () => {
  const session = await login("minh");
  const urls: URL[] = [];
  const observe = ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    if (url.pathname === "/api/tasks") urls.push(url);
  };
  function TaskList({ filters }: { filters: TaskQuery }) {
    const query = useListTasksQuery(filters);
    return <span>{query.data ? "ready" : "waiting"}</span>;
  }
  server.events.on("request:start", observe);
  try {
    const client = show(
      <>
        <TaskList filters={{ q: "  Khảo sát  " }} />
        <TaskList
          filters={{ q: "Khảo sát", page: 1, pageSize: 20, sort: "dueAt" }}
        />
      </>,
      session,
    );
    await waitFor(() => expect(screen.getAllByText("ready")).toHaveLength(2));
    expect(urls).toHaveLength(1);
    expect(Object.fromEntries(urls[0].searchParams)).toMatchObject({
      q: "Khảo sát",
      page: "1",
      pageSize: "20",
      sort: "dueAt",
    });
    expect(
      client
        .getQueryCache()
        .findAll({ queryKey: tasksKeys.viewer(session.user.id) }),
    ).toHaveLength(1);
  } finally {
    server.events.removeListener("request:start", observe);
  }
});
it("uses normalized opaque IDs and empty filters for both cache keys and HTTP paths", async () => {
  const session = await login("minh");
  const paths: string[] = [];
  const observe = ({ request }: { request: Request }) => {
    if (request.method === "GET") paths.push(new URL(request.url).pathname);
  };
  function Task({ id }: { id: string }) {
    const query = useGetTaskQuery(id);
    return <span>{query.data ? "task-ready" : "task-waiting"}</span>;
  }
  function Members({ id, q }: { id: string; q?: string }) {
    const query = useListProjectMembersQuery(id, { q });
    return <span>{query.data ? "members-ready" : "members-waiting"}</span>;
  }
  server.events.on("request:start", observe);
  try {
    const client = show(
      <>
        <Task id=" t-3 " />
        <Task id="t-3" />
        <Task id="" />
        <Task id={"x".repeat(101)} />
        <Members id=" p-main " q="   " />
        <Members id="p-main" />
      </>,
      session,
    );
    await waitFor(() =>
      expect(screen.getAllByText("task-ready")).toHaveLength(2),
    );
    await waitFor(() =>
      expect(screen.getAllByText("members-ready")).toHaveLength(2),
    );
    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/tasks/t-3",
        "/api/projects/p-main/members",
      ]),
    );
    expect(paths).toHaveLength(2);
    expect(
      client
        .getQueryCache()
        .findAll({ queryKey: tasksKeys.getTask(session.user.id, "t-3") }),
    ).toHaveLength(1);
    expect(
      client
        .getQueryCache()
        .findAll({ queryKey: ["project-members", session.user.id] }),
    ).toHaveLength(1);
  } finally {
    server.events.removeListener("request:start", observe);
  }
});
it("opens an analysis once under StrictMode, keeps metrics while waiting, then renders the matching explanation", async () => {
  const session = await login("minh");
  const dash = await analyticsService.getDashboard({
    projectId: "p-main",
    from: "2026-10-01",
    to: "2026-10-23",
  });
  const id = dash.overviewRef.analysisId;
  let posts = 0;
  const observe = ({ request }: { request: Request }) => {
    if (
      request.method === "POST" &&
      new URL(request.url).pathname === "/api/analytics/jobs"
    )
      posts++;
  };
  server.events.on("request:start", observe);
  try {
    show(<AnalysisDetailPage analysisId={id} />, session, true);
    await screen.findByRole("heading", { name: "Chỉ số phân tích" });
    await waitFor(() => expect(posts).toBe(1));
    expect(screen.getByText("Ý nghĩa chỉ số")).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Bối cảnh phân tích" }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Dữ liệu căn cứ" }),
    ).toBeNull();
    await screen.findByText("AI mô phỏng", { exact: false }, { timeout: 6000 });
    expect(posts).toBe(1);
    expect(db.jobs.size).toBe(1);
    const detail = db.details.get(id)!;
    expect(detail.explanation.lastSuccess?.snapshotId).toBe(detail.snapshot.id);
  } finally {
    server.events.removeListener("request:start", observe);
  }
}, 10000);
it("preserves report input on validation failure and saves then submits a zero-hour report", async () => {
  const session = await login("lan");
  const draft = await reportsService.createReportDraft(
    {
      projectId: "p-main",
      periodType: "DAILY",
      periodStart: "2026-10-21",
    },
    {
      key: "screen-draft",
    },
  );
  const user = userEvent.setup();
  const client = show(<ReportPage reportId={draft.id} edit />, session);
  const achievements = await screen.findByLabelText("Kết quả thực hiện");
  await waitFor(() => expect(client.isFetching()).toBe(0));
  let previews = 0;
  const observe = ({ request }: { request: Request }) => {
    if (
      request.method === "GET" &&
      new URL(request.url).pathname === "/api/report-previews"
    )
      previews++;
  };
  server.events.on("request:start", observe);
  try {
    const refresh = screen.getByRole("button", { name: "Làm mới số liệu" });
    await user.click(refresh);
    await waitFor(() => expect(refresh).toHaveProperty("disabled", false));
    expect(previews).toBe(1);
  } finally {
    server.events.removeListener("request:start", observe);
  }
  const plan = screen.getByLabelText("Kế hoạch tiếp theo");
  await user.type(achievements, "Đối chiếu tiêu chí nghiệm thu");
  await user.type(plan, "Thực hiện kiểm thử tích hợp");
  await user.click(
    screen.getByRole("checkbox", { name: "Gửi và chốt báo cáo sau khi lưu" }),
  );
  await user.click(screen.getByRole("button", { name: "Lưu và gửi báo cáo" }));
  await screen.findByText("Cần giải thích kỳ không có giờ công.");
  expect((achievements as HTMLTextAreaElement).value).toBe(
    "Đối chiếu tiêu chí nghiệm thu",
  );
  expect(db.reports.find((r) => r.id === draft.id)?.status).toBe("DRAFT");
  await user.type(
    screen.getByLabelText("Lý do nếu không có giờ công"),
    "Rà soát tài liệu, chưa ghi giờ trong kỳ này.",
  );
  await user.click(screen.getByRole("button", { name: "Lưu và gửi báo cáo" }));
  await waitFor(() =>
    expect(db.reports.find((r) => r.id === draft.id)?.status).toBe("SUBMITTED"),
  );
  expect(nav.push).toHaveBeenCalledWith(`/reports/${draft.id}`);
});
it("keeps task edits through a version conflict and saves with the accepted snapshot", async () => {
  const session = await login("minh");
  const user = userEvent.setup();
  const client = show(<TaskEditorPage taskId="t-3" />, session);
  const title = await screen.findByLabelText("Tên công việc *");
  await user.clear(title);
  await user.type(title, "Công việc đã được điều chỉnh");
  await act(async () => {
    const task = await tasksService.getTask("t-3");
    await tasksService.updateTask(
      task.id,
      { description: "Cập nhật từ người quản lý khác" },
      {
        version: task.version,
        key: "other-task-edit",
      },
    );
    await client.invalidateQueries({ queryKey: ["tasks"] });
  });
  await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
  const reload = await screen.findByRole("button", {
    name: "Tải bản mới để đối chiếu",
  });
  expect((title as HTMLInputElement).value).toBe(
    "Công việc đã được điều chỉnh",
  );
  const version = db.tasks.find((task) => task.id === "t-3")!.version;
  await user.click(reload);
  await user.click(
    await screen.findByRole("button", {
      name: "Đã đối chiếu, tiếp tục chỉnh sửa",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/tasks/t-3"));
  expect(db.tasks.find((task) => task.id === "t-3")).toMatchObject({
    title: "Công việc đã được điều chỉnh",
    version: version + 1,
  });
});
it("submits the current assignee's result from the dialog through HTTP and releases dirty state", async () => {
  const session = await login("lan");
  const user = userEvent.setup();
  history.replaceState(null, "", "/tasks/t-3#submit");
  show(<SubmitResultDialog taskId="t-3" />, session);
  await user.type(
    await screen.findByLabelText("Tóm tắt kết quả *"),
    "Đã hoàn tất biểu mẫu và đối chiếu tiêu chí.",
  );
  await user.type(
    screen.getByLabelText("Liên kết minh chứng"),
    "https://example.test/evidence",
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận nộp" }));
  await waitFor(() =>
    expect(db.tasks.find((t) => t.id === "t-3")?.status).toBe("PENDING_REVIEW"),
  );
  expect(
    db.submissions.filter((s) => s.taskId === "t-3" && s.status === "PENDING"),
  ).toHaveLength(1);
  expect(nav.push).toHaveBeenCalledWith("/tasks/t-3/submissions");
  await waitFor(() => expect(useUI.getState().dirtyForms).toHaveLength(0));
});
it("keeps submission text after a stale version conflict and retries only after accepting the reloaded version", async () => {
  const session = await login("lan");
  const user = userEvent.setup();
  history.replaceState(null, "", "/tasks/t-3#submit");
  const client = show(<SubmitResultDialog taskId="t-3" />, session);
  const input = await screen.findByLabelText("Tóm tắt kết quả *");
  await user.type(input, "Kết quả được giữ khi có xung đột.");
  await act(async () => {
    const task = await tasksService.getTask("t-3");
    await tasksService.updateRemainingEstimate(
      "t-3",
      { remainingMinutes: 30 },
      {
        version: task.version,
        key: "other-update",
      },
    );
    await client.invalidateQueries({ queryKey: ["tasks"] });
  });
  await user.click(screen.getByRole("button", { name: "Xác nhận nộp" }));
  await screen.findByRole("button", { name: "Tải bản mới để đối chiếu" });
  expect((input as HTMLTextAreaElement).value).toBe(
    "Kết quả được giữ khi có xung đột.",
  );
  expect(db.tasks.find((t) => t.id === "t-3")?.status).toBe("IN_PROGRESS");
  await user.click(
    screen.getByRole("button", { name: "Tải bản mới để đối chiếu" }),
  );
  await user.click(
    await screen.findByRole("button", {
      name: "Đã đối chiếu, tiếp tục chỉnh sửa",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận nộp" }));
  await waitFor(() =>
    expect(db.tasks.find((t) => t.id === "t-3")?.status).toBe("PENDING_REVIEW"),
  );
});
