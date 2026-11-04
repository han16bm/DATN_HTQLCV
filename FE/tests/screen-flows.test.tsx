// @vitest-environment jsdom
import { AdminShell } from "@/components/layout/admin-shell";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/patterns/data-table";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { ReportsPage } from "@/features/reports/components/reports-page";
import { UsersPage } from "@/features/users/components/users-page";
import { usersService } from "@/features/users/api/users.service";
import { usersKeys } from "@/features/users/api/users.keys";
import { organizationService } from "@/features/organization/api/organization.service";
import { ProjectsPage } from "@/features/projects/components/projects-page";
import { MemberProfilePage } from "@/features/users/components/member-profile-page";
import { ReviewsPage } from "@/features/submissions/components/reviews-page";
import { OrganizationPage } from "@/features/organization/components/organization-page";
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
import { ProjectMembersPage } from "@/features/project-members/components/project-members-page";
import { projectMembersService } from "@/features/project-members/api/project-members.service";
import { reportsService } from "@/features/reports/api/reports.service";
import { ReportPage } from "@/features/reports/components/report-page";
import { ReviewForm } from "@/features/submissions/components/review-form";
import { submissionsService } from "@/features/submissions/api/submissions.service";
import { SubmissionDetailPage } from "@/features/submissions/components/submission-detail-page";
import { TaskHistoryPage } from "@/features/tasks/components/task-history-page";
import { TaskDetailPage } from "@/features/tasks/components/task-detail-page";
import { TaskListPage } from "@/features/tasks/components/task-list-page";
import { TaskShell } from "@/features/tasks/components/task-shell";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { TaskEditorPage } from "@/features/tasks/components/task-editor-page";
import { useUpdateTaskMutation } from "@/features/tasks/hooks/use-tasks-mutations";
import { timeLogsService } from "@/features/time-logs/api/time-logs.service";
import { AlertDetailPage } from "@/features/alerts/components/alert-detail-page";
import { alertsService } from "@/features/alerts/api/alerts.service";
import { alertsKeys } from "@/features/alerts/api/alerts.keys";
import { useGetAlertQuery } from "@/features/alerts/hooks/use-alerts-queries";
import { analyticsKeys } from "@/features/analytics/api/analytics.keys";
import { useGetAnalysisDetailQuery } from "@/features/analytics/hooks/use-analytics-queries";
import { DashboardPage } from "@/features/analytics/components/dashboard-page";
import { ProjectShell } from "@/features/projects/components/project-shell";
import { ProjectDetailPage } from "@/features/projects/components/project-detail-page";
import { ProjectEditorPage } from "@/features/projects/components/project-editor-page";
import { TodayPage } from "@/features/tasks/components/today-page";
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
  fireEvent,
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
  vi.unstubAllEnvs();
  cleanup();
  for (const client of clients) client.clear();
  clients.length = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });
// Dialog Thêm/Xem/Sửa của khu quản trị đọc trạng thái từ URL (ADMIN_MODULES 9).
const at = (url: string) => history.replaceState(null, "", url);
const lastNav = (fn: typeof nav.replace) =>
  new URL(fn.mock.calls.at(-1)![0] as string, location.origin);
// ANALYTICS_VIEW cấp ở phạm vi hệ thống qua nhóm quyền của backend, không theo role.
const grantSystemAnalytics = (userId: string) =>
  db.permissionGroups
    .find((group) => group.id === "pg-analytics")!
    .memberIds.push(userId);
// Tài khoản chỉ quản trị: bỏ cờ sysadmin và thu hồi ANALYTICS_VIEW của nhóm ADMINISTRATORS.
const accountAdminOnly = () =>
  Object.assign(
    db.users.find((user) => user.id === "u-admin")!,
    {
      isSysAdmin: false,
      revokedFeatures: ["ANALYTICS_VIEW"],
    },
  );
// JSDOM has no image decoder, layout or canvas; keep the cropper and HTTP real.
function avatarBrowser() {
  const create = vi.fn(() => `blob:http://localhost/${crypto.randomUUID()}`);
  const revoke = vi.fn();
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = create;
      static revokeObjectURL = revoke;
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 400, 400),
  );
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
    800,
  );
  vi.spyOn(HTMLImageElement.prototype, "naturalHeight", "get").mockReturnValue(
    400,
  );
  const draw = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: draw,
  } as unknown as CanvasRenderingContext2D);
  const bytes = new TextEncoder().encode("RIFF0000WEBPcropped");
  const encode = vi
    .spyOn(HTMLCanvasElement.prototype, "toBlob")
    .mockImplementation((done) =>
      done(new Blob([bytes], { type: "image/webp" })),
    );
  const file = new File(["original image"], "avatar.png", {
    type: "image/png",
  });
  return { create, revoke, draw, encode, file, bytes };
}
it("shows loading feedback before listing actual start dates from the task response", async () => {
  const session = await login("minh");
  const result = await tasksService.listTasks();
  vi.stubEnv("NEXT_PUBLIC_MSW_DELAY", "80");
  const client = show(
    <WorkspaceShell>
      <TaskListPage />
    </WorkspaceShell>,
    session,
  );
  expect(screen.getByRole("status", { name: "Đang tải dữ liệu" })).toBeTruthy();
  const header = screen
    .getByRole("button", { name: "Mở menu tài khoản" })
    .closest("header")!;
  expect(within(header).queryByRole("status")).toBeNull();
  // Tiêu đề cột hiện ngay cùng khung xương; dữ liệu chỉ có sau khi tải xong.
  await waitFor(() =>
    expect(
      screen.queryByRole("status", { name: "Đang tải dữ liệu" }),
    ).toBeNull(),
  );
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
  let refresh!: Promise<void>;
  act(() => {
    refresh = client.refetchQueries({
      queryKey: tasksKeys.viewer(session.user.id),
    });
  });
  const busy = await screen.findByRole("status", {
    name: "Đang cập nhật bảng",
  });
  expect(screen.getByRole("main").contains(busy)).toBe(true);
  expect(within(header).queryByRole("status")).toBeNull();
  await act(async () => {
    await refresh;
  });
  await waitFor(() =>
    expect(
      screen.queryByRole("status", { name: "Đang cập nhật bảng" }),
    ).toBeNull(),
  );
});
it("retries a failed HTTP read, shows pending feedback, and replaces the error with recovered data", async () => {
  const session = await login("lan");
  const client = show(<TaskDetailPage taskId="t-2" />, session);
  await screen.findByRole("heading", { name: "Nội dung công việc" });
  let attempts = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.get("*/api/tasks/t-2", async () => {
      if (++attempts === 1) return HttpResponse.json({ invalid: true });
      await ready;
    }),
  );
  await act(async () => {
    await client.refetchQueries({
      queryKey: tasksKeys.getTask(session.user.id, "t-2"),
    });
  });
  const error = await screen.findByRole("alert");
  const user = userEvent.setup();
  await user.click(within(error).getByRole("button", { name: "Thử tải lại" }));
  const pending = await screen.findByRole("button", { name: "Đang tải lại…" });
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  expect(pending.getAttribute("aria-busy")).toBe("true");
  await waitFor(() => expect(attempts).toBe(2));
  await user.click(pending);
  expect(attempts).toBe(2);
  release();
  await screen.findByRole("heading", { name: "Nội dung công việc" });
  expect(screen.queryByRole("alert")).toBeNull();
});

it("does not submit its enclosing form when retrying a failed request", async () => {
  const submit = vi.fn();
  let release!: () => void;
  const retry = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  show(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <QueryErrorState error={new Error("Chưa tải được tệp.")} retry={retry} />
    </form>,
    await login("lan"),
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Thử tải lại" }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(submit).not.toHaveBeenCalled();
  expect(
    (screen.getByRole("button", { name: "Đang tải lại…" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await act(async () => release());
  await screen.findByRole("button", { name: "Thử tải lại" });
  expect(submit).not.toHaveBeenCalled();
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
it("shows a leader's roles across projects in the Dự án tab and hides session revocation for oneself", async () => {
  const session = await login("admin");
  at("/admin/users?dialog=view&id=u-pm");
  show(<UsersPage />, session);
  const dialog = await screen.findByRole("dialog", {
    name: "Chi tiết tài khoản",
  });
  expect(
    await within(dialog).findByRole("button", {
      name: "Thu hồi phiên đăng nhập",
    }),
  ).toBeTruthy();
  await userEvent
    .setup()
    .click(within(dialog).getByRole("tab", { name: "Dự án" }));
  const table = await within(dialog).findByRole("table", {
    name: "Dự án tham gia",
  });
  const rows = within(table).getAllByRole("row").slice(1);
  expect(rows.length).toBeGreaterThan(1);
  expect(within(table).getAllByText("Phụ trách").length).toBeGreaterThan(0);
  cleanup();
  at("/admin/users?dialog=view&id=u-admin");
  show(<UsersPage />, session);
  const own = await screen.findByRole("dialog", { name: "Chi tiết tài khoản" });
  await within(own).findByRole("button", { name: "Khóa tài khoản" });
  expect(
    within(own).queryByRole("button", { name: "Thu hồi phiên đăng nhập" }),
  ).toBeNull();
});
it("keeps admin account information and access actions together without exposing internal IDs", async () => {
  const session = await login("admin");
  at("/admin/users?dialog=view&id=u-admin");
  show(<UsersPage />, session);
  const dialog = await screen.findByRole("dialog", {
    name: "Chi tiết tài khoản",
  });
  const email = await within(dialog).findByRole("textbox", { name: "Email *" });
  expect(email).toHaveProperty("value", "admin@example.test");
  // Chế độ Xem: mọi trường disable trong fieldset.
  expect(email.closest("fieldset")).toHaveProperty("disabled", true);
  expect(screen.queryByText(/Mã tài khoản/)).toBeNull();
  expect(within(dialog).getByText(/Tạo bởi/)).toBeTruthy();
  expect(
    within(dialog).getByRole("button", { name: "Khóa tài khoản" }),
  ).toBeTruthy();
  await userEvent
    .setup()
    .click(within(dialog).getByRole("button", { name: "Chỉnh sửa" }));
  expect(Object.fromEntries(lastNav(nav.replace).searchParams)).toEqual({
    dialog: "edit",
    id: "u-admin",
  });
  cleanup();
  at("/admin/users?dialog=edit&id=u-admin");
  show(<UsersPage />, session);
  expect(
    await screen.findByRole("textbox", { name: "Họ tên *" }),
  ).toHaveProperty("value", session.user.displayName);
  expect(
    screen.getByRole("textbox", { name: "Họ tên *" }).closest("fieldset"),
  ).toHaveProperty("disabled", false);
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
      screen
        .getByRole("button", { name: "Mở menu tài khoản" })
        .getAttribute("title"),
    ).toBe("Lan Nguyễn"),
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
it("drags and zooms an avatar, uploads only the cropped image and updates the avatar menu", async () => {
  const session = await login("admin");
  const browser = avatarBrowser();
  show(
    <WorkspaceShell>
      <ProfilePage />
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Ảnh đại diện" }));
  await user.upload(screen.getByLabelText("Chọn ảnh"), browser.file);
  const dialog = await screen.findByRole("dialog", { name: "Chỉnh sửa ảnh" });
  const image = within(dialog).getByAltText("Ảnh đang cắt");
  fireEvent.load(image);
  fireEvent.change(
    within(dialog).getByRole("slider", { name: "Thu phóng ảnh" }),
    { target: { value: "2" } },
  );
  const initial = image.style.transform;
  fireEvent.mouseDown(image.parentElement!, { clientX: 200, clientY: 200 });
  fireEvent.mouseMove(document, { clientX: 260, clientY: 200 });
  await waitFor(() => expect(image.style.transform).not.toBe(initial));
  fireEvent.mouseUp(document);
  expect(useUI.getState().dirtyForms).toEqual([]);
  expect((await authService.getSession()).user.version).toBe(
    session.user.version,
  );
  await user.click(within(dialog).getByRole("button", { name: "Cập nhật" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(browser.draw).toHaveBeenCalledWith(
    image,
    240,
    100,
    200,
    200,
    0,
    0,
    512,
    512,
  );
  expect(browser.revoke).toHaveBeenCalledWith(
    browser.create.mock.results[0].value,
  );
  expect(
    screen
      .getByRole("tab", { name: "Ảnh đại diện" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  const updated = await authService.getSession();
  expect(updated.user.avatarUrl).toBeTruthy();
  const uploaded = await fetch(`http://gateway.test${updated.user.avatarUrl}`);
  expect(uploaded.headers.get("content-type")).toBe("image/webp");
  expect(Array.from(new Uint8Array(await uploaded.arrayBuffer()))).toEqual(
    Array.from(browser.bytes),
  );
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
it("rejects oversized avatars before cropping and leaves the avatar section without a discard prompt", async () => {
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
  await screen.findByText("Ảnh không được vượt quá 2 MB.");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect((await authService.getSession()).user.version).toBe(
    session.user.version,
  );
  await user.click(screen.getByRole("tab", { name: "Thông tin cá nhân" }));
  await screen.findByRole("button", { name: "Lưu hồ sơ" });
  expect(screen.queryByRole("alertdialog")).toBeNull();
});
it("cancels avatar cropping without saving or prompting and allows selecting the same file again", async () => {
  const session = await login("lan");
  const browser = avatarBrowser();
  show(<ProfilePage />, session);
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Ảnh đại diện" }));
  await user.upload(screen.getByLabelText("Chọn ảnh"), browser.file);
  await user.click(
    within(await screen.findByRole("dialog")).getByRole("button", {
      name: "Hủy",
    }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(browser.revoke).toHaveBeenCalledTimes(1);
  await user.upload(screen.getByLabelText("Chọn ảnh"), browser.file);
  await screen.findByRole("dialog");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(browser.revoke).toHaveBeenCalledTimes(2);
  expect(browser.encode).not.toHaveBeenCalled();
  expect((await authService.getSession()).user.version).toBe(
    session.user.version,
  );
  expect(useUI.getState().dirtyForms).toEqual([]);
  await user.click(screen.getByRole("tab", { name: "Thông tin cá nhân" }));
  await screen.findByRole("button", { name: "Lưu hồ sơ" });
  expect(screen.queryByRole("alertdialog")).toBeNull();
});
it("keeps the crop and zoom after a version conflict and retries with the accepted profile version", async () => {
  const session = await login("lan");
  const browser = avatarBrowser();
  show(<ProfilePage />, session);
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Ảnh đại diện" }));
  await user.upload(screen.getByLabelText("Chọn ảnh"), browser.file);
  const dialog = await screen.findByRole("dialog");
  fireEvent.load(within(dialog).getByAltText("Ảnh đang cắt"));
  const slider = within(dialog).getByRole("slider", { name: "Thu phóng ảnh" });
  fireEvent.change(slider, { target: { value: "1.5" } });
  await authService.updateProfile(
    { displayName: "Tên mới từ phiên khác" },
    { version: session.user.version, key: crypto.randomUUID() },
  );
  await user.click(within(dialog).getByRole("button", { name: "Cập nhật" }));
  await user.click(
    await screen.findByRole("button", { name: "Tải bản mới để đối chiếu" }),
  );
  await user.click(
    await screen.findByRole("button", {
      name: "Đã đối chiếu, tiếp tục chỉnh sửa",
    }),
  );
  expect(slider).toHaveProperty("value", "1.5");
  expect(browser.revoke).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole("button", { name: "Cập nhật" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect((await authService.getSession()).user).toMatchObject({
    displayName: "Tên mới từ phiên khác",
    version: session.user.version + 2,
  });
  expect(browser.draw.mock.calls[0]).toEqual(browser.draw.mock.calls[1]);
});
it("retains the selected crop when image encoding fails and permits retrying", async () => {
  const session = await login("lan");
  const browser = avatarBrowser();
  browser.encode.mockImplementationOnce((done) => done(null));
  show(<ProfilePage />, session);
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Ảnh đại diện" }));
  await user.upload(screen.getByLabelText("Chọn ảnh"), browser.file);
  const dialog = await screen.findByRole("dialog");
  fireEvent.load(within(dialog).getByAltText("Ảnh đang cắt"));
  fireEvent.change(within(dialog).getByRole("slider"), {
    target: { value: "1.5" },
  });
  await user.click(within(dialog).getByRole("button", { name: "Cập nhật" }));
  await within(dialog).findByText("Không cắt được ảnh. Vui lòng thử lại.");
  expect((await authService.getSession()).user.version).toBe(
    session.user.version,
  );
  expect(browser.revoke).not.toHaveBeenCalled();
  expect(within(dialog).getByRole("slider")).toHaveProperty("value", "1.5");
  await user.click(within(dialog).getByRole("button", { name: "Cập nhật" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect((await authService.getSession()).user.version).toBe(
    session.user.version + 1,
  );
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
it.each(["lan", "minh"] as const)(
  "lists open work in one table with quick actions in a menu and a side rail for %s",
  async (username) => {
    const user = userEvent.setup();
    const session = await login(username);
    const mine = await tasksService.listTasks({
      assigneeId: session.user.id,
      pageSize: 100,
    });
    const open = mine.items.filter((t) =>
      ["NEW", "TODO", "IN_PROGRESS", "PENDING_REVIEW"].includes(t.status),
    );
    show(<TodayPage />, session);
    const list = await screen.findByRole("region", { name: "Việc của tôi" });
    const chips = within(list).getByRole("group", {
      name: "Lọc theo mức cần làm",
    });
    expect(
      within(chips).getByRole("button", { name: /^Tất cả/ }).textContent,
    ).toContain(String(open.length));
    // Chỉ một bảng, không chia theo trạng thái; mỗi việc một hàng.
    if (open.length === 0)
      expect(
        within(list).getByText("Bạn đã xử lý hết công việc đang mở"),
      ).toBeTruthy();
    else {
      const table = await within(list).findByRole("table");
      expect(within(list).getAllByRole("table")).toHaveLength(1);
      expect(within(table).getAllByRole("row")).toHaveLength(open.length + 1);
    }
    const quick = [
      ["IN_PROGRESS", "Nộp kết quả", "#submit"],
      ["TODO", "Bắt đầu", "#execution"],
    ] as const;
    for (const task of open) {
      const link = within(list).getByRole("link", { name: task.title });
      expect(link.getAttribute("href")).toBe(`/tasks/${task.id}`);
      // Thao tác nhanh nằm trong menu thả xuống của hàng, không phải nút rải rác.
      const entry = quick.find(([status]) => status === task.status);
      await user.click(
        within(list).getByRole("button", { name: `Thao tác: ${task.title}` }),
      );
      const menu = await screen.findByRole("menu");
      if (entry)
        expect(
          within(menu)
            .getByRole("menuitem", { name: entry[1] })
            .getAttribute("href"),
        ).toBe(`/tasks/${task.id}${entry[2]}`);
      expect(
        within(menu)
          .getByRole("menuitem", { name: "Xem chi tiết" })
          .getAttribute("href"),
      ).toBe(`/tasks/${task.id}`);
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    }
    const rail = screen.getByRole("complementary", { name: "Cần chú ý" });
    expect(
      within(rail).getByRole("region", { name: "Báo cáo nháp" }),
    ).toBeTruthy();
    expect(
      Boolean(within(rail).queryByRole("region", { name: "Chờ nghiệm thu" })),
    ).toBe(username === "minh");
    const projects = within(rail).getByRole("region", {
      name: "Dự án của tôi",
    });
    expect(
      (
        await within(projects).findByRole("link", {
          name: /Cổng quản lý nội bộ/,
        })
      ).getAttribute("href"),
    ).toBe("/projects/p-main");
    if (username === "minh") {
      const create = await screen.findByRole("button", {
        name: "Tạo công việc",
      });
      await userEvent.setup().click(create);
      const dialog = await screen.findByRole("dialog", {
        name: "Chọn dự án tạo công việc",
      });
      const project = within(dialog).getByRole("combobox", {
        name: "Dự án bạn quản lý *",
      });
      expect(
        within(project).queryByRole("option", { name: "Dự án ngoài phạm vi" }),
      ).toBeNull();
    } else {
      expect(
        screen.queryByRole("button", { name: "Tạo công việc" }),
      ).toBeNull();
    }
  },
);
it("narrows the day's work to one urgency group from the chips", async () => {
  const session = await login("lan");
  show(<TodayPage />, session);
  const list = await screen.findByRole("region", { name: "Việc của tôi" });
  const user = userEvent.setup();
  // Bảng chỉ có sau khi danh sách việc của tôi tải xong; lan có một việc đang làm
  // và một việc sắp tới.
  const table = await within(list).findByRole("table");
  expect(within(table).getAllByRole("row")).toHaveLength(3);
  const chip = within(list).getByRole("button", { name: /^Đang thực hiện/ });
  await user.click(chip);
  expect(chip.getAttribute("aria-pressed")).toBe("true");
  expect(within(list).getAllByRole("table")).toHaveLength(1);
  expect(within(table).getAllByRole("row")).toHaveLength(2);
  await user.click(within(list).getByRole("button", { name: /^Tất cả/ }));
  expect(within(table).getAllByRole("row")).toHaveLength(3);
});
it("prompts for the unit by name and blocks account creation when it is unselected", async () => {
  const session = await login("admin");
  const count = db.users.length;
  at("/admin/users?dialog=create");
  show(<UsersPage />, session);
  const user = userEvent.setup();
  const unit = await screen.findByRole("combobox", { name: "Đơn vị *" });
  await user.selectOptions(unit, "");
  await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
  await screen.findByText("Vui lòng chọn đơn vị.");
  expect(unit.getAttribute("aria-invalid")).toBe("true");
  expect(screen.queryByText("Thiếu mã tài nguyên.")).toBeNull();
  expect(db.users).toHaveLength(count);
});
it("switches compact analytics sections while preserving the selected scope", async () => {
  const session = await login("minh");
  history.replaceState(
    null,
    "",
    "/analytics/risks?unitId=unit-product&projectId=p-main&from=2026-10-01&to=2026-10-23",
  );
  show(
    <WorkspaceShell>
      <RisksPage />
    </WorkspaceShell>,
    session,
  );
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Phân tích" }));
  const menu = within(await screen.findByRole("menu"));
  expect(
    menu
      .getByRole("menuitem", { name: "Nguy cơ trễ hạn" })
      .getAttribute("aria-current"),
  ).toBe("page");
  expect(screen.queryByRole("combobox", { name: "Mục phân tích" })).toBeNull();
  expect(screen.queryByRole("combobox", { name: "Đơn vị" })).toBeNull();
  const target = new URL(
    menu.getByRole("menuitem", { name: "Khối lượng" }).getAttribute("href")!,
    location.origin,
  );
  expect(target.pathname).toBe("/analytics/workload");
  expect(Object.fromEntries(target.searchParams)).toEqual({
    unitId: "unit-product",
    projectId: "p-main",
    from: "2026-10-01",
    to: "2026-10-23",
  });
  // Cảnh báo là mục riêng ở sidebar cho mọi nhân viên, không nằm trong menu Phân tích.
  expect(menu.queryByRole("menuitem", { name: "Cảnh báo" })).toBeNull();
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
  const surface = screen
    .getByRole("table", { name: "Danh sách" })
    .closest('[data-slot="card"]')!;
  expect(
    surface.contains(within(card).getByRole("heading", { name: "Danh sách" })),
  ).toBe(false);
  expect(within(surface as HTMLElement).getByText("6 kết quả")).toBeTruthy();
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
  at("/admin/users?q=");
  show(<UsersPage />, session);
  const row = (await screen.findByText("Trần Lan")).closest("tr")!;
  expect(within(row).getByText("lan@example.test · lan")).toBeTruthy();
  expect(row.querySelector('[aria-hidden="true"]')?.textContent).toBe("TL");
  const cells = within(row).getAllByRole("cell");
  const link = within(cells.at(-1)!).getByRole("link", {
    name: "Xem hồ sơ Trần Lan",
  });
  expect(link.getAttribute("href")).toBe(
    "/admin/users?q=&dialog=view&id=u-lan",
  );
  expect(
    within(cells.at(-1)!)
      .getByRole("link", { name: "Sửa hồ sơ Trần Lan" })
      .getAttribute("href"),
  ).toBe("/admin/users?q=&dialog=edit&id=u-lan");
  expect(
    within(cells[0])
      .getByRole("link", { name: "Xem hồ sơ công khai của Trần Lan" })
      .getAttribute("href"),
  ).toBe("/users/u-lan");
});
it("shows review task titles from the queue response without fetching every task again", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/reviews?projectId=p-main&q=API&page=1");
  const requests: URL[] = [];
  const observe = ({ request }: { request: Request }) =>
    requests.push(new URL(request.url));
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
    expect(
      requests.filter((url) => url.pathname.startsWith("/api/tasks/")),
    ).toEqual([]);
    const queue = requests.find((url) => url.pathname === "/api/review-queue")!;
    expect(queue.searchParams.get("q")).toBe("API");
    expect(queue.searchParams.get("projectId")).toBe("p-main");
    const search = screen.getByRole("searchbox", { name: "Tìm công việc" });
    expect(search).toHaveProperty("value", "API");
    fireEvent.change(search, { target: { value: "giao diện" } });
    const next = new URL(nav.replace.mock.calls.at(-1)![0], location.href);
    expect(next.searchParams.get("q")).toBe("giao diện");
    expect(next.searchParams.get("projectId")).toBe("p-main");
    expect(next.searchParams.has("page")).toBe(false);
  } finally {
    server.events.removeListener("request:start", observe);
  }
});
it("splits common and management functions and guards unsaved changes from both menus", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/projects/p-main/edit");
  show(
    <WorkspaceShell>
      <p>Nội dung dự án</p>
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  const main = screen.getByRole("navigation", { name: "Điều hướng chính" });
  expect(main.closest("aside")).toBeTruthy();
  expect(
    within(main)
      .getAllByRole("link")
      .map((link) => link.textContent),
  ).toEqual(["Tổng quan", "Dự án", "Báo cáo", "Cảnh báo"]);
  const management = screen.getByRole("navigation", {
    name: "Điều hướng quản lý",
  });
  expect(management.closest("header")).toBeTruthy();
  expect(
    within(management).getByRole("button", { name: "Phân tích" }),
  ).toBeTruthy();
  expect(
    within(management).queryByRole("button", { name: "Công việc" }),
  ).toBeNull();
  expect(screen.getByRole("button", { name: /^Dự án:/ })).toBeTruthy();
  expect(within(main).getByRole("button", { name: "Công việc" })).toBeTruthy();
  act(() => useUI.getState().markDirty("navigation-test", true));
  await user.click(
    within(management).getByRole("link", { name: "Nghiệm thu" }),
  );
  const confirm = await screen.findByRole("alertdialog", {
    name: "Thay đổi chưa được lưu",
  });
  expect(document.activeElement).toBe(
    within(confirm).getByRole("button", { name: "Ở lại" }),
  );
  await user.click(within(confirm).getByRole("button", { name: "Ở lại" }));
  expect(useUI.getState().dirtyForms).toEqual(["navigation-test"]);
  expect(nav.push).not.toHaveBeenCalled();
  await user.click(within(main).getByRole("link", { name: "Báo cáo" }));
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Bỏ thay đổi",
    }),
  );
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/reports"));
  expect(useUI.getState().dirtyForms).toEqual([]);
  expect(useUI.getState().sidebarCollapsed).toBe(false);
});
it("marks the open section on the header with aria-current", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/reviews");
  show(
    <WorkspaceShell>
      <p>Nghiệm thu</p>
    </WorkspaceShell>,
    session,
  );
  const main = screen.getByRole("navigation", { name: "Điều hướng quản lý" });
  expect(
    within(main)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page")
      .map((link) => link.textContent),
  ).toEqual(["Nghiệm thu"]);
});
it("opens an accessible mobile menu, filters roles and restores focus after Escape", async () => {
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
  await user.click(within(dialog).getByRole("button", { name: "Công việc" }));
  expect(within(dialog).getByRole("link", { name: "Tất cả" })).toBeTruthy();
  expect(
    within(dialog).queryByRole("link", { name: "Việc của tôi" }),
  ).toBeNull();
  expect(
    within(dialog).queryByRole("button", { name: "Phân tích" }),
  ).toBeNull();
  expect(within(dialog).queryByRole("link", { name: "Tài khoản" })).toBeNull();
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
  accountAdminOnly();
  const session = await login("admin");
  show(
    <WorkspaceShell>
      <ProfilePage />
    </WorkspaceShell>,
    session,
  );
  const user = userEvent.setup();
  const main = screen.getByRole("navigation", { name: "Điều hướng chính" });
  expect(within(main).queryByText("Đăng xuất")).toBeNull();
  // Quản trị không nằm trong menu làm việc.
  expect(within(main).queryByRole("button", { name: "Phân tích" })).toBeNull();
  expect(within(main).queryByRole("link", { name: "Tài khoản" })).toBeNull();
  const email = screen.getByRole("textbox", { name: "Email" });
  expect(email).toHaveProperty("value", "admin@example.test");
  expect(email).toHaveProperty("readOnly", true);
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
    within(menu)
      .getByRole("menuitem", { name: "Quản trị hệ thống" })
      .getAttribute("href"),
  ).toBe("/admin");
  expect(
    within(menu).getByRole("menuitem", { name: "Đăng xuất" }),
  ).toBeTruthy();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
});
it("preserves an unsaved form when cancelling a mode switch and applies the selected mode after confirmation", async () => {
  const session = await login("minh");
  show(
    <ReviewForm
      close={vi.fn()}
      submission={await submissionsService.getSubmission("t-4", "s-pending")}
      reload={async () => ({
        data: await submissionsService.getSubmission("t-4", "s-pending"),
      })}
    />,
    session,
  );
  const user = userEvent.setup();
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
it("combines the project overview, tasks and members, and opens history without leaving the page", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/projects/p-main");
  const reads: string[] = [];
  const observe = ({ request }: { request: Request }) =>
    reads.push(new URL(request.url).pathname);
  server.events.on("request:start", observe);
  try {
    show(
      <ProjectShell projectId="p-main">
        <ProjectDetailPage projectId="p-main" />
      </ProjectShell>,
      session,
    );
    await screen.findByRole("heading", { name: "Mục tiêu dự án" });
    const tasks = screen.getByRole("region", { name: "Công việc dự án" });
    await within(tasks).findByRole("link", {
      name: "Thiết kế luồng giao việc",
    });
    const members = screen.getByRole("region", { name: "Thành viên dự án" });
    await within(members).findByRole("link", {
      name: "Xem hồ sơ công khai của Trần Lan",
    });
    expect(within(members).queryByRole("table")).toBeNull();
    expect(within(members).queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Mục dự án" })).toBeNull();
    expect(reads).not.toContain("/api/projects/p-main/history");
    expect(reads).not.toContain("/api/projects");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Lịch sử dự án" }));
    const historyPanel = await screen.findByRole("dialog", {
      name: "Lịch sử dự án",
    });
    await within(historyPanel).findByText("Triển khai dự án");
    expect(location.hash).toBe("#history");
    expect(reads).toContain("/api/projects/p-main/history");
    await userEvent.setup().keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(tasks.isConnected && members.isConnected).toBe(true);
    expect(location.pathname).toBe("/projects/p-main");
    expect(nav.push).not.toHaveBeenCalled();
  } finally {
    server.events.removeListener("request:start", observe);
  }
});

it("limits the member preview to five and loads the complete table only after opening its drawer", async () => {
  const source = db.members.find((member) => member.projectId === "p-main")!;
  for (let i = 0; i < 5; i++) {
    const id = `u-preview-${i}`;
    db.users.push({
      ...db.users[0],
      id,
      username: `preview-${i}`,
      displayName: `Thành viên ${i}`,
      email: `preview-${i}@example.test`,
    });
    db.members.push({
      ...source,
      id: `m-preview-${i}`,
      userId: id,
      projectRole: "MEMBER",
    });
  }
  const session = await login("minh");
  history.replaceState(null, "", "/projects/p-main");
  const reads: URL[] = [];
  const observe = ({ request }: { request: Request }) =>
    reads.push(new URL(request.url));
  server.events.on("request:start", observe);
  try {
    show(<ProjectDetailPage projectId="p-main" />, session);
    const summary = await screen.findByRole("region", {
      name: "Thành viên dự án",
    });
    await within(summary).findByRole("list");
    expect(within(summary).getAllByRole("listitem")).toHaveLength(5);
    expect(within(summary).queryByRole("table")).toBeNull();
    expect(
      reads.filter(
        (url) =>
          url.pathname.endsWith("/members") &&
          url.searchParams.get("pageSize") === "100",
      ),
    ).toHaveLength(1);
    expect(
      reads.some(
        (url) =>
          url.pathname.endsWith("/members") &&
          url.searchParams.get("pageSize") === "20",
      ),
    ).toBe(false);
    await userEvent
      .setup()
      .click(within(summary).getByRole("button", { name: "Chi tiết" }));
    const panel = await screen.findByRole("dialog", {
      name: "Thành viên dự án",
    });
    const table = await within(panel).findByRole("table");
    await within(table).findByRole("link", {
      name: "Xem hồ sơ công khai của Thành viên 4",
    });
    expect(within(table).getAllByRole("row")).toHaveLength(9);
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Thành viên", "Vai trò"]);
    expect(
      reads.some(
        (url) =>
          url.pathname.endsWith("/members") &&
          url.searchParams.get("pageSize") === "20",
      ),
    ).toBe(true);
  } finally {
    server.events.removeListener("request:start", observe);
  }
});

it("keeps task and member searches and pagination independent on the project page", async () => {
  const session = await login("minh");
  history.replaceState(
    null,
    "",
    "/projects/p-main?q=API&page=1&members.q=Lan&members.page=1",
  );
  const reads: URL[] = [];
  const observe = ({ request }: { request: Request }) =>
    reads.push(new URL(request.url));
  server.events.on("request:start", observe);
  try {
    show(<ProjectDetailPage projectId="p-main" />, session);
    const tasks = await screen.findByRole("region", {
      name: "Công việc dự án",
    });
    const summary = screen.getByRole("region", { name: "Thành viên dự án" });
    await within(tasks).findByRole("link", { name: "API báo cáo tuần" });
    await userEvent
      .setup()
      .click(within(summary).getByRole("button", { name: "Chi tiết" }));
    const members = await screen.findByRole("dialog", {
      name: "Thành viên dự án",
    });
    await within(members).findByRole("link", {
      name: "Xem hồ sơ công khai của Trần Lan",
    });
    expect(
      within(members).queryByRole("link", {
        name: "Xem hồ sơ công khai của Nguyễn Huy",
      }),
    ).toBeNull();
    expect(
      reads.some(
        (url) =>
          url.pathname === "/api/tasks" && url.searchParams.get("q") === "API",
      ),
    ).toBe(true);
    expect(
      reads.some(
        (url) =>
          url.pathname === "/api/projects/p-main/members" &&
          url.searchParams.get("q") === "Lan",
      ),
    ).toBe(true);
    fireEvent.change(within(members).getByRole("searchbox"), {
      target: { value: "Huy" },
    });
    await waitFor(() => expect(nav.replace).toHaveBeenCalled());
    const target = new URL(nav.replace.mock.calls.at(-1)![0], location.href);
    expect(target.searchParams.get("q")).toBe("API");
    expect(target.searchParams.get("page")).toBe("1");
    expect(target.searchParams.get("members.q")).toBe("Huy");
    expect(target.searchParams.has("members.page")).toBe(false);
    expect(target.hash).toBe("#members");
  } finally {
    server.events.removeListener("request:start", observe);
  }
});

it.each([
  { username: "lan", visible: false },
  { username: "minh", visible: true },
  { username: "admin", visible: true },
])(
  "shows the own-task filter only when useful for $username and preserves the list context",
  async ({ username, visible }) => {
    const session = await login(username);
    history.replaceState(
      null,
      "",
      "/tasks?projectId=p-main&q=API&view=board&page=2",
    );
    show(<TaskListPage />, session);
    const filters = within(
      screen.getByRole("region", { name: "Bộ lọc công việc" }),
    );
    const mine = filters.queryByRole("button", { name: "Việc của tôi" });
    expect(Boolean(mine)).toBe(visible);
    if (!mine) return;
    await userEvent.setup().click(mine);
    const target = new URL(nav.replace.mock.calls.at(-1)![0], location.href);
    expect(target.pathname).toBe("/tasks");
    expect(Object.fromEntries(target.searchParams)).toEqual({
      projectId: "p-main",
      q: "API",
      view: "board",
      assigneeId: session.user.id,
    });
  },
);

it("keeps creation in the project header and the view buttons with filters while preserving task filters", async () => {
  history.replaceState(
    null,
    "",
    "/projects/p-main?q=API&status=TODO&page=2#tasks",
  );
  const session = await login("minh");
  show(
    <ProjectShell projectId="p-main">
      <TaskListPage projectId="p-main" />
    </ProjectShell>,
    session,
  );
  const heading = await screen.findByRole("heading", {
    level: 1,
    name: "Cổng quản lý nội bộ",
  });
  const header = within(heading.closest("header")!);
  const create = await header.findByRole("button", { name: "Tạo công việc" });
  expect(screen.getAllByRole("button", { name: "Tạo công việc" })).toHaveLength(
    1,
  );
  expect(screen.queryByRole("navigation", { name: "Mục dự án" })).toBeNull();
  expect(header.queryByRole("group", { name: "Chế độ xem" })).toBeNull();
  const filters = within(
    screen.getByRole("region", { name: "Bộ lọc công việc" }),
  );
  expect(filters.getByRole("group", { name: "Chế độ xem" })).toBeTruthy();
  expect(filters.queryByRole("button", { name: "Tạo công việc" })).toBeNull();
  const user = userEvent.setup();
  await user.click(filters.getByRole("button", { name: "Bảng trạng thái" }));
  const next = new URL(nav.replace.mock.calls.at(-1)![0], location.href);
  expect(next.pathname).toBe("/projects/p-main");
  expect(next.hash).toBe("#tasks");
  expect(Object.fromEntries(next.searchParams)).toEqual({
    q: "API",
    status: "TODO",
    page: "2",
    view: "board",
  });
  await user.click(create);
  expect(nav.push).toHaveBeenCalledWith("/projects/p-main/tasks/new");
});

it("opens member management in the drawer and returns to the list after closing its add form", async () => {
  history.replaceState(null, "", "/projects/p-main");
  show(
    <ProjectShell projectId="p-main">
      <ProjectDetailPage projectId="p-main" />
    </ProjectShell>,
    await login("minh"),
  );
  const heading = await screen.findByRole("heading", {
    level: 1,
    name: "Cổng quản lý nội bộ",
  });
  const members = await screen.findByRole("region", {
    name: "Thành viên dự án",
  });
  expect(
    within(members).queryByRole("button", { name: "Thêm thành viên" }),
  ).toBeNull();
  const user = userEvent.setup();
  await user.click(within(members).getByRole("button", { name: "Chi tiết" }));
  const panel = await screen.findByRole("dialog", { name: "Thành viên dự án" });
  const add = await within(panel).findByRole("button", {
    name: "Thêm thành viên",
  });
  expect(
    within(heading.closest("header")!).queryByRole("button", {
      name: "Thêm thành viên",
    }),
  ).toBeNull();
  expect(
    screen.getAllByRole("button", { name: "Thêm thành viên" }),
  ).toHaveLength(1);
  await user.click(add);
  expect(
    await screen.findByRole("dialog", { name: "Thêm thành viên dự án" }),
  ).toBeTruthy();
  expect(panel.isConnected).toBe(true);
  await user.click(screen.getByRole("button", { name: "Đóng biểu mẫu" }));
  await waitFor(() => expect(location.hash).toBe("#members"));
  expect(screen.getByRole("dialog", { name: "Thành viên dự án" })).toBeTruthy();
  await user.click(
    within(panel).getByRole("button", { name: "Thêm thành viên" }),
  );
  const form = within(
    await screen.findByRole("dialog", { name: "Thêm thành viên dự án" }),
  );
  await user.type(
    form.getByRole("textbox", { name: "Mã tài khoản nội bộ *" }),
    "u-other",
  );
  await user.click(form.getByRole("button", { name: "Thêm thành viên" }));
  await waitFor(() => expect(location.hash).toBe("#members"));
  await within(panel).findByRole("link", {
    name: "Xem hồ sơ công khai của Người dùng dự án khác",
  });
  await within(members).findByRole("link", {
    name: "Xem hồ sơ công khai của Người dùng dự án khác",
    hidden: true,
  });
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(
    within(members).getByRole("button", { name: "Chi tiết" }),
  );
});
it("changes a project role from the member list and preserves the draft through a version conflict", async () => {
  db.permissionGroups.find((g) => g.id === "pg-pm")!.memberIds.push("u-lan");
  const session = await login("minh");
  history.replaceState(null, "", "/projects/p-main/members");
  show(<ProjectMembersPage projectId="p-main" />, session);
  const row = (
    await screen.findByRole("link", {
      name: "Xem hồ sơ công khai của Trần Lan",
    })
  ).closest("tr")!;
  expect(
    screen.queryByRole("columnheader", { name: "Quyền nghiệp vụ" }),
  ).toBeNull();
  const owner = screen
    .getByRole("link", { name: "Xem hồ sơ công khai của Nguyễn Minh" })
    .closest("tr")!;
  expect(
    within(owner).queryByRole("button", { name: "Đổi vai trò" }),
  ).toBeNull();
  const user = userEvent.setup();
  expect(screen.queryByText(/manage &&/)).toBeNull();
  await user.click(
    within(row).getByRole("button", { name: "Thao tác Trần Lan" }),
  );
  await user.click(
    await screen.findByRole("menuitem", { name: "Đổi vai trò" }),
  );
  const dialog = within(
    await screen.findByRole("dialog", { name: "Đổi vai trò thành viên" }),
  );
  const select = dialog.getByRole("combobox", { name: "Vai trò dự án *" });
  await user.selectOptions(select, "MANAGER");
  await user.type(
    dialog.getByRole("textbox", { name: "Lý do thay đổi *" }),
    "Hỗ trợ quản lý dự án",
  );
  const member = db.members.find(
    (member) => member.projectId === "p-main" && member.userId === "u-lan",
  )!;
  await projectMembersService.updateProjectMemberRole(
    "p-main",
    member.id,
    { projectRole: "MEMBER", reason: "Cập nhật đồng thời" },
    { version: member.version, key: "concurrent-role" },
  );
  await user.click(dialog.getByRole("button", { name: "Lưu vai trò" }));
  await user.click(
    await dialog.findByRole("button", { name: "Tải bản mới để đối chiếu" }),
  );
  await dialog.findByText("Bản mới nhất — nội dung bạn nhập được giữ lại");
  expect(select).toHaveProperty("value", "MANAGER");
  await user.click(
    dialog.getByRole("button", { name: "Đã đối chiếu, tiếp tục chỉnh sửa" }),
  );
  await user.click(dialog.getByRole("button", { name: "Lưu vai trò" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const saved = (
    await projectMembersService.listProjectMembers("p-main")
  ).items.find((member) => member.userId === "u-lan")!;
  expect(saved.projectRole).toBe("MANAGER");
  expect(saved).not.toHaveProperty("permissions");
});
it("keeps a task edit draft when cancelling navigation and leaves only after confirmation", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-3/edit");
  show(
    <WorkspaceShell>
      <TaskShell taskId="t-3">
        <TaskEditorPage taskId="t-3" />
      </TaskShell>
    </WorkspaceShell>,
    session,
  );
  const projects = within(
    await screen.findByRole("navigation", { name: "Điều hướng chính" }),
  ).getByRole("link", { name: "Dự án" });
  const user = userEvent.setup();
  const input = await screen.findByRole("textbox", { name: "Tên công việc *" });
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  await user.clear(input);
  await user.type(input, "Công việc đang sửa");
  await user.click(projects);
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ở lại",
    }),
  );
  expect(nav.push).not.toHaveBeenCalled();
  expect(input).toHaveProperty("value", "Công việc đang sửa");
  await user.click(projects);
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Bỏ thay đổi",
    }),
  );
  expect(nav.push).toHaveBeenCalledWith("/projects");
  expect(db.tasks.find((task) => task.id === "t-3")?.title).not.toBe(
    "Công việc đang sửa",
  );
});
it("opens a review only on request and approves the current submission through HTTP", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-4/submissions/s-pending");
  show(
    <TaskShell taskId="t-4">
      <SubmissionDetailPage taskId="t-4" submissionId="s-pending" />
    </TaskShell>,
    session,
  );
  const user = userEvent.setup();
  const open = await screen.findByRole("button", {
    name: "Quyết định nghiệm thu",
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

it("opens time logs, history and submission details as slide panels without leaving the task page", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-4");
  show(<TaskDetailPage taskId="t-4" />, session);
  const user = userEvent.setup();
  const closeAndWait = async () => {
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(location.hash).toBe("");
  };
  await user.click(await screen.findByRole("button", { name: "Nhật ký" }));
  await screen.findByRole("dialog", { name: "Nhật ký giờ công" });
  expect(location.hash).toBe("#time-logs");
  await closeAndWait();
  await user.click(screen.getByRole("button", { name: "Lịch sử" }));
  const logs = await screen.findByRole("dialog", {
    name: "Lịch sử công việc",
  });
  expect(await within(logs).findByText("Thời điểm")).toBeTruthy();
  expect(location.hash).toBe("#history");
  const changes = await within(logs).findByRole("button", {
    name: "Xem thay đổi: Tạo công việc",
  });
  await user.click(changes);
  await screen.findByRole("dialog", { name: "Chi tiết thay đổi" });
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Chi tiết thay đổi" }),
    ).toBeNull(),
  );
  expect(screen.getByRole("dialog", { name: "Lịch sử công việc" })).toBe(logs);
  expect(location.hash).toBe("#history");
  expect(document.activeElement).toBe(changes);
  await closeAndWait();
  await user.click(
    await screen.findByRole("button", { name: "Xem lần nộp 1" }),
  );
  const detail = await screen.findByRole("dialog", {
    name: "Chi tiết lần nộp",
  });
  expect(await within(detail).findByText("Kết quả đã nộp")).toBeTruthy();
  expect(
    await within(detail).findByRole("heading", { name: "Báo cáo đính kèm" }),
  ).toBeTruthy();
  await closeAndWait();
  expect(nav.push).not.toHaveBeenCalled();
});
it("opens the latest review from the task header and shows its decision form immediately", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-4");
  show(
    <TaskShell taskId="t-4">
      <span />
    </TaskShell>,
    session,
  );
  const review = await screen.findByRole("button", {
    name: "Quyết định nghiệm thu",
  });
  expect(review.closest("header")).toBeTruthy();
  const header = within(review.closest("header")!);
  expect(header.getByText("Trạng thái:")).toBeTruthy();
  expect(header.getByText("Chờ nghiệm thu")).toBeTruthy();
  await userEvent.setup().click(review);
  const dialog = await screen.findByRole("dialog", {
    name: "Quyết định nghiệm thu",
  });
  expect(
    await within(dialog).findByRole("textbox", { name: "Nhận xét" }),
  ).toBeTruthy();
  expect(location.pathname).toBe("/tasks/t-4");
  expect(nav.push).not.toHaveBeenCalled();
  expect(
    await within(dialog).findByText("Đã hoàn thiện API báo cáo"),
  ).toBeTruthy();
  const user = userEvent.setup();
  const comment = within(dialog).getByRole("textbox", { name: "Nhận xét" });
  await user.type(comment, "Đang đối chiếu tiêu chí");
  await user.keyboard("{Escape}");
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ở lại",
    }),
  );
  expect(comment).toHaveProperty("value", "Đang đối chiếu tiêu chí");
  await user.click(
    within(dialog).getByRole("button", { name: "Đóng biểu mẫu" }),
  );
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Bỏ thay đổi",
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(db.submissions.find((item) => item.id === "s-pending")?.status).toBe(
    "PENDING",
  );
  expect(useUI.getState().dirtyForms).toEqual([]);
});
it.each(["admin", "huy"])(
  "keeps the review action hidden for %s without eligible review access",
  async (username) => {
    if (username === "admin") grantSystemAnalytics("u-admin");
    const session = await login(username);
    history.replaceState(null, "", "/tasks/t-4/submissions/s-pending");
    show(
      <TaskShell taskId="t-4">
        <SubmissionDetailPage taskId="t-4" submissionId="s-pending" />
      </TaskShell>,
      session,
    );
    await screen.findByText("Đã hoàn thiện API báo cáo");
    expect(
      screen.queryByRole("button", { name: "Quyết định nghiệm thu" }),
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
  const event = await screen.findByRole("button", {
    name: "Xem thay đổi: Điều chỉnh công việc",
  });
  const row = event.closest("tr")!;
  expect(within(row).getByText("Nguyễn Minh")).toBeTruthy();
  expect(row.querySelector('span[aria-hidden="true"]')).not.toBeNull();
  expect(event.textContent).toBe("Chi tiết");
  expect(screen.getByRole("columnheader", { name: "Hành động" })).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByText("Mô tả được cập nhật")).toBeNull();
  const user = userEvent.setup();
  await user.click(event);
  const changes = within(
    await screen.findByRole("dialog", { name: "Chi tiết thay đổi" }),
  );
  expect(changes.getByText("Mô tả")).toBeTruthy();
  expect(changes.getByText("Mô tả được cập nhật")).toBeTruthy();
  expect(changes.getByText("Cao")).toBeTruthy();
  expect(changes.queryByText('"before"')).toBeNull();
  expect(within(row).queryByText("Mô tả được cập nhật")).toBeNull();
  expect(row.querySelector("pre")).toBeNull();
  expect(event.getAttribute("aria-expanded")).toBe("true");
  await user.click(
    changes.getByRole("button", { name: "Đóng chi tiết lịch sử" }),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(event);
  const created = screen.getByRole("button", {
    name: "Xem thay đổi: Tạo công việc",
  });
  await user.click(created);
  expect(created.getAttribute("aria-expanded")).toBe("true");
  expect(event.getAttribute("aria-expanded")).toBe("false");
  expect(
    within(screen.getByRole("dialog")).queryByText("Mô tả được cập nhật"),
  ).toBeNull();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(created);
});
it("opens project changes in the same history drawer and restores focus on close", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/projects/p-main#history");
  show(<ProjectDetailPage projectId="p-main" />, session);
  const action = await screen.findByRole("button", { name: /Xem thay đổi:/ });
  const user = userEvent.setup();
  expect(
    screen.queryByRole("dialog", { name: "Chi tiết thay đổi" }),
  ).toBeNull();
  await user.click(action);
  const detail = await screen.findByRole("dialog", {
    name: "Chi tiết thay đổi",
  });
  expect(within(detail).getByText("Nguyễn Minh")).toBeTruthy();
  expect(within(detail).getByText("Trước")).toBeTruthy();
  expect(within(detail).getByText("Sau")).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(
    screen.queryByRole("dialog", { name: "Chi tiết thay đổi" }),
  ).toBeNull();
  expect(action.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(action);
});
it.each([
  [
    "units",
    "/admin/organization",
    "Danh sách đơn vị",
    "Phòng sản phẩm",
    "/admin/organization?dialog=view&id=unit-product",
  ],
  [
    "teams",
    "/admin/teams",
    "Danh sách nhóm",
    "Nhóm phát triển",
    "/admin/teams?dialog=view&id=team-main",
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
      ).toBe(`${path}?dialog=create`);
    } finally {
      server.events.removeListener("request:start", observe);
    }
  },
);
it("shows unit details in a view dialog and edits them in the same form", async () => {
  const session = await login("admin");
  at("/admin/organization?dialog=view&id=unit-product");
  show(<OrganizationPage />, session);
  const user = userEvent.setup();
  const dialog = await screen.findByRole("dialog", { name: "Phòng sản phẩm" });
  const edit = await within(dialog).findByRole("button", { name: "Chỉnh sửa" });
  const name = within(dialog).getByRole("textbox", { name: "Tên đơn vị *" });
  expect(name.closest("fieldset")).toHaveProperty("disabled", true);
  const close = within(dialog).getByRole("button", {
    name: "Ngừng sử dụng đơn vị",
  });
  expect(edit.parentElement).toBe(close.parentElement);
  await user.click(edit);
  expect(lastNav(nav.replace).search).toBe("?dialog=edit&id=unit-product");
  cleanup();
  at("/admin/organization?dialog=edit&id=unit-product");
  show(<OrganizationPage />, session);
  const field = await screen.findByRole("textbox", { name: "Tên đơn vị *" });
  expect(
    screen.queryByRole("button", { name: "Ngừng sử dụng đơn vị" }),
  ).toBeNull();
  await user.clear(field);
  await user.type(field, "Phòng sản phẩm mới");
  await user.click(screen.getByRole("button", { name: "Hủy" }));
  await user.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Ở lại",
    }),
  );
  expect(field).toHaveProperty("value", "Phòng sản phẩm mới");
  await user.type(
    screen.getByRole("textbox", { name: "Lý do thay đổi *" }),
    "Điều chỉnh cơ cấu",
  );
  await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  await waitFor(() =>
    expect(lastNav(nav.replace).search).toBe("?dialog=view&id=unit-product"),
  );
  expect(db.units.find((unit) => unit.id === "unit-product")).toMatchObject({
    name: "Phòng sản phẩm mới",
    version: 2,
  });
  expect(useUI.getState().dirtyForms).toEqual([]);
});
it("creates a unit from the create dialog through HTTP", async () => {
  const session = await login("admin");
  at("/admin/organization?dialog=create");
  show(<OrganizationPage />, session);
  const user = userEvent.setup();
  await user.type(
    await screen.findByRole("textbox", { name: "Tên đơn vị *" }),
    "Phòng vận hành",
  );
  await user.click(screen.getByRole("button", { name: "Thêm đơn vị" }));
  await waitFor(() => expect(nav.replace).toHaveBeenCalled());
  const unit = db.units.find((unit) => unit.name === "Phòng vận hành")!;
  expect(unit.status).toBe("ACTIVE");
  expect(lastNav(nav.replace).search).toBe(
    `?dialog=view&id=${encodeURIComponent(unit.id)}`,
  );
});
it("edits team members in the edit dialog with a searchable selection box", async () => {
  const session = await login("admin");
  at("/admin/teams?dialog=edit&id=team-main");
  show(<TeamsPage />, session);
  const user = userEvent.setup();
  await user.click(await screen.findByRole("tab", { name: "Thành viên" }));
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
  await waitFor(() =>
    expect(lastNav(nav.replace).search).toBe("?dialog=view&id=team-main"),
  );
  expect(db.teams.find((team) => team.id === "team-main")).toMatchObject({
    memberIds: ["u-lan"],
    version: 2,
  });
  cleanup();
  show(<TeamsPage />, session);
  await user.type(
    await screen.findByRole("textbox", { name: "Tên nhóm *" }),
    " mới",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Lý do thay đổi *" }),
    "Đổi tên nhóm",
  );
  await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  await waitFor(() =>
    expect(db.teams.find((team) => team.id === "team-main")).toMatchObject({
      name: "Nhóm phát triển mới",
      version: 3,
    }),
  );
});
it("creates a team from the create dialog and opens its view dialog", async () => {
  const session = await login("admin");
  at("/admin/teams?dialog=create");
  show(<TeamsPage />, session);
  const user = userEvent.setup();
  await user.type(
    await screen.findByRole("textbox", { name: "Tên nhóm *" }),
    "Nhóm vận hành",
  );
  await user.click(screen.getByRole("button", { name: "Tạo nhóm" }));
  await waitFor(() => expect(nav.replace).toHaveBeenCalled());
  const team = db.teams.find((team) => team.name === "Nhóm vận hành")!;
  expect(team.status).toBe("ACTIVE");
  expect(lastNav(nav.replace).search).toBe(
    `?dialog=view&id=${encodeURIComponent(team.id)}`,
  );
});
it("displays the upload policy from HTTP and rejects oversized files before posting", async () => {
  const session = await login("lan");
  server.use(
    http.get("*/api/attachments/policy", () =>
      HttpResponse.json({
        maxBytes: 1024 ** 2,
        maxAttachments: 2,
        allowedMimeTypes: ["text/plain"],
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
it("uses received IDs for cache and HTTP, skips empty IDs and reports malformed IDs through the API", async () => {
  const session = await login("minh");
  const paths: string[] = [];
  const observe = ({ request }: { request: Request }) => {
    if (request.method === "GET") paths.push(new URL(request.url).pathname);
  };
  function Task({ id }: { id: string }) {
    const query = useGetTaskQuery(id);
    return (
      <span>
        {query.isError
          ? "task-error"
          : query.data
            ? "task-ready"
            : "task-waiting"}
      </span>
    );
  }
  function Members({ id, q }: { id: string; q?: string }) {
    const query = useListProjectMembersQuery(id, { q });
    return <span>{query.data ? "members-ready" : "members-waiting"}</span>;
  }
  server.events.on("request:start", observe);
  try {
    const client = show(
      <>
        <Task id="t-3" />
        <Task id="t-3" />
        <Task id="" />
        <Task id={"x".repeat(101)} />
        <Members id="p-main" q="   " />
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
    await screen.findByText("task-error");
    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/tasks/t-3",
        `/api/tasks/${"x".repeat(101)}`,
        "/api/projects/p-main/members",
      ]),
    );
    expect(paths).toHaveLength(3);
    expect(
      client.getQueryState(tasksKeys.getTask(session.user.id, "x".repeat(101))),
    ).toMatchObject({ status: "error", error: { status: 422 } });
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
  const achievements = await screen.findByLabelText("Kết quả thực hiện *");
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
  const plan = screen.getByLabelText("Kế hoạch tiếp theo *");
  await user.type(achievements, "Đối chiếu tiêu chí nghiệm thu");
  await user.type(plan, "Thực hiện kiểm thử tích hợp");
  await user.click(screen.getByRole("button", { name: "Gửi báo cáo" }));
  await screen.findByText("Cần giải thích kỳ không có giờ công.");
  expect((achievements as HTMLTextAreaElement).value).toBe(
    "Đối chiếu tiêu chí nghiệm thu",
  );
  expect(db.reports.find((r) => r.id === draft.id)?.status).toBe("DRAFT");
  await user.type(
    screen.getByLabelText("Lý do nếu không có giờ công"),
    "Rà soát tài liệu, chưa ghi giờ trong kỳ này.",
  );
  await user.click(screen.getByRole("button", { name: "Gửi báo cáo" }));
  await waitFor(() =>
    expect(db.reports.find((r) => r.id === draft.id)?.status).toBe("SUBMITTED"),
  );
  expect(nav.push).toHaveBeenCalledWith(`/reports/${draft.id}`);
});
it("can save an incomplete draft after send validation without submitting the report", async () => {
  const session = await login("lan");
  const draft = await reportsService.createReportDraft(
    { projectId: "p-main", periodType: "DAILY", periodStart: "2026-10-21" },
    { key: "draft-after-send-validation" },
  );
  const user = userEvent.setup();
  const client = show(<ReportPage reportId={draft.id} edit />, session);
  await screen.findByLabelText("Kết quả thực hiện *");
  await waitFor(() => expect(client.isFetching()).toBe(0));
  await user.click(screen.getByRole("button", { name: "Gửi báo cáo" }));
  await screen.findByText("Kết quả thực hiện là bắt buộc khi gửi.");
  await screen.findByText("Kế hoạch tiếp theo là bắt buộc khi gửi.");
  await user.type(screen.getByLabelText("Khó khăn"), "Cần đối chiếu số liệu");
  await user.click(screen.getByRole("button", { name: "Lưu nháp" }));
  await waitFor(() =>
    expect(db.reports.find((r) => r.id === draft.id)?.blockers).toBe(
      "Cần đối chiếu số liệu",
    ),
  );
  expect(db.reports.find((r) => r.id === draft.id)?.status).toBe("DRAFT");
  expect(
    screen.queryByText("Kết quả thực hiện là bắt buộc khi gửi."),
  ).toBeNull();
  expect(nav.push).not.toHaveBeenCalled();
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
  show(
    <TaskShell taskId="t-3">
      <p>Công việc</p>
    </TaskShell>,
    session,
  );
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
  expect(nav.push).toHaveBeenCalledWith("/tasks/t-3");
  await waitFor(() => expect(useUI.getState().dirtyForms).toHaveLength(0));
});
it("keeps submission text after a stale version conflict and retries only after accepting the reloaded version", async () => {
  const session = await login("lan");
  const user = userEvent.setup();
  history.replaceState(null, "", "/tasks/t-3#submit");
  const client = show(
    <TaskShell taskId="t-3">
      <p>Công việc</p>
    </TaskShell>,
    session,
  );
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

it("returns invalid list filters as an HTTP error instead of leaving a query disabled", async () => {
  const session = await login("minh");
  function InvalidList() {
    const query = useListTasksQuery({ pageSize: 101 });
    return <span>{query.isError ? query.error.message : "waiting"}</span>;
  }
  show(<InvalidList />, session);
  await waitFor(() => expect(screen.queryByText("waiting")).toBeNull());
  expect(screen.getByText(/Thông tin/)).toBeTruthy();
});

it("assigns a task without an unnecessary handover reason", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-1");
  show(
    <TaskShell taskId="t-1">
      <span />
    </TaskShell>,
    session,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Giao việc" }));
  await user.selectOptions(
    await screen.findByLabelText("Người nhận mới *"),
    "u-lan",
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận phân công" }));
  await waitFor(() =>
    expect(db.tasks.find((task) => task.id === "t-1")).toMatchObject({
      assigneeId: "u-lan",
      status: "TODO",
      version: 2,
    }),
  );
  await waitFor(() => expect(useUI.getState().dirtyForms).toEqual([]));
});

it("starts and pauses a task through the keyed action form", async () => {
  const session = await login("lan");
  history.replaceState(null, "", "/tasks/t-2");
  show(
    <TaskShell taskId="t-2">
      <span />
    </TaskShell>,
    session,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Bắt đầu" }));
  await user.click(await screen.findByRole("button", { name: "Xác nhận" }));
  await user.click(
    await screen.findByRole("button", { name: "Thao tác công việc" }),
  );
  await user.click(
    await screen.findByRole("menuitem", { name: "Tạm dừng / hủy" }),
  );
  const firstStartedAt = db.tasks.find(
    (task) => task.id === "t-2",
  )!.firstStartedAt;
  expect(firstStartedAt).toBeTruthy();
  await user.type(
    await screen.findByLabelText("Lý do tạm dừng *"),
    "Chờ xác nhận yêu cầu.",
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận" }));
  await screen.findByRole("button", { name: "Bắt đầu" });
  expect(db.tasks.find((task) => task.id === "t-2")).toMatchObject({
    status: "TODO",
    firstStartedAt,
    version: 3,
  });
});

it("creates, edits and voids a time log while retaining the correct version source", async () => {
  const session = await login("lan");
  const task = await tasksService.getTask("t-2");
  const started = await tasksService.startTask(task.id, {
    version: task.version,
    key: "form-start",
  });
  history.replaceState(null, "", "/tasks/t-2#time-log");
  show(
    <TaskShell taskId={task.id}>
      <p>Công việc</p>
    </TaskShell>,
    session,
  );
  const user = userEvent.setup();
  const date = await screen.findByLabelText("Ngày làm việc (Việt Nam) *");
  fireEvent.change(date, {
    target: { value: started.firstStartedAt!.slice(0, 10) },
  });
  await user.type(screen.getByLabelText("Số phút *"), "30");
  await user.type(
    screen.getByLabelText("Nội dung thực hiện *"),
    "Kiểm tra quyền truy cập.",
  );
  await user.click(screen.getByRole("button", { name: "Lưu nhật ký" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/tasks/t-2"));
  const log = (await timeLogsService.listTimeLogs(task.id)).items[0];
  expect(log.minutes).toBe(30);
  async function reopen() {
    await act(async () => {
      history.replaceState(null, "", `/tasks/t-2?timeLogId=${log.id}#time-log`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
  }
  await reopen();
  const minutes = await screen.findByLabelText("Số phút *");
  await user.clear(minutes);
  await user.type(minutes, "45");
  await user.type(
    screen.getByLabelText("Lý do chỉnh sửa *"),
    "Bổ sung thời gian kiểm tra.",
  );
  await user.click(screen.getByRole("button", { name: "Lưu nhật ký" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect((await timeLogsService.listTimeLogs(task.id)).items[0]).toMatchObject({
    minutes: 45,
    version: log.version + 1,
  });
  await reopen();
  await user.selectOptions(await screen.findByLabelText("Thao tác"), "VOID");
  await user.type(
    await screen.findByLabelText("Lý do loại khỏi tổng *"),
    "Nhật ký bị ghi trùng.",
  );
  await user.click(
    screen.getByRole("button", { name: "Xác nhận loại khỏi tổng" }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect((await timeLogsService.listTimeLogs(task.id)).items[0]).toMatchObject({
    status: "VOID",
    version: log.version + 2,
  });
  expect((await tasksService.getTask(task.id)).actualMinutes).toBe(0);
});

it("marks an alert as read without requiring a resolution note", async () => {
  const session = await login("minh");
  show(<AlertDetailPage alertId="alert-1" />, session);
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "Cập nhật xử lý" }),
  );
  await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/alerts"));
  expect((await alertsService.getAlert("alert-1")).status).toBe("READ");
});

it("reuses an idempotency key after a failed request and releases it after success", async () => {
  const session = await login("minh");
  const task = await tasksService.getTask("t-1");
  const keys: string[] = [];
  let fail = true;
  server.use(
    http.patch("*/api/tasks/t-1", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key")!);
      if (fail) {
        fail = false;
        return HttpResponse.error();
      }
    }),
  );
  function UpdateTask() {
    const mutation = useUpdateTaskMutation();
    return (
      <button
        disabled={mutation.isPending}
        onClick={() =>
          void mutation
            .mutateAsync({
              taskId: task.id,
              version: task.version,
              payload: { title: "Công việc được cập nhật an toàn" },
            })
            .catch(() => {})
        }
      >
        {mutation.isError ? "Thử lại" : "Lưu"}
      </button>
    );
  }
  show(<UpdateTask />, session);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Lưu" }));
  await user.click(await screen.findByRole("button", { name: "Thử lại" }));
  await waitFor(() =>
    expect(db.tasks.find((value) => value.id === task.id)?.version).toBe(
      task.version + 1,
    ),
  );
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  // The same input is now a new attempt; the stale version must still be rejected.
  const save = await screen.findByRole("button", { name: "Lưu" });
  await waitFor(() => expect(save).toHaveProperty("disabled", false));
  await user.click(save);
  await screen.findByRole("button", { name: "Thử lại" });
  expect(keys).toHaveLength(3);
  expect(keys[2]).not.toBe(keys[1]);
  expect(db.tasks.find((value) => value.id === task.id)?.version).toBe(
    task.version + 1,
  );
});

it("edits only project fields shown in the form and preserves immutable legacy data", async () => {
  const session = await login("minh");
  const project = db.projects.find((value) => value.id === "p-main")!;
  project.code = "x";
  let body: unknown;
  server.use(
    http.patch("*/api/projects/p-main", async ({ request }) => {
      body = await request.clone().json();
    }),
  );
  show(<ProjectEditorPage projectId={project.id} />, session);
  const user = userEvent.setup();
  const name = await screen.findByLabelText("Tên dự án *");
  expect(screen.queryByLabelText("Mã dự án *")).toBeNull();
  expect(screen.queryByLabelText("Đơn vị *")).toBeNull();
  await user.clear(name);
  await user.type(name, "Dự án đã đổi tên");
  await user.type(
    screen.getByLabelText("Lý do điều chỉnh *"),
    "Điều chỉnh tên kế hoạch.",
  );
  await user.click(screen.getByRole("button", { name: "Lưu kế hoạch" }));
  await waitFor(() =>
    expect(nav.push).toHaveBeenCalledWith("/projects/p-main"),
  );
  expect(body).toEqual({
    name: "Dự án đã đổi tên",
    changeReason: "Điều chỉnh tên kế hoạch.",
  });
  expect(project.code).toBe("x");
});

it("opens analytics and review entries from the permissions in the session, not from the role name", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/workspace");
  show(
    <WorkspaceShell>
      <span>Không gian làm việc</span>
    </WorkspaceShell>,
    session,
  );
  const main = screen.getByRole("navigation", { name: "Điều hướng quản lý" });
  expect(within(main).getByRole("button", { name: "Phân tích" })).toBeTruthy();
  expect(within(main).getByRole("link", { name: "Nghiệm thu" })).toBeTruthy();
  // Quản trị hệ thống không còn nằm trong menu làm việc.
  for (const name of ["Người dùng", "Đơn vị", "Team"])
    expect(within(main).queryByRole("link", { name })).toBeNull();
  cleanup();
  const revoked = structuredClone(session);
  revoked.projectAccess = revoked.projectAccess.map((project) => ({
    ...project,
    permissions: [],
  }));
  show(
    <WorkspaceShell>
      <span>Không gian làm việc</span>
    </WorkspaceShell>,
    revoked,
  );
  expect(
    screen.queryByRole("navigation", { name: "Điều hướng quản lý" }),
  ).toBeNull();
});

it("shows only the administration entry the account is permitted to open", async () => {
  const session = await login("admin");
  session.permissions = ["ORGANIZATION_MANAGE"];
  history.replaceState(null, "", "/admin/users");
  show(
    <AdminShell>
      <UsersPage />
    </AdminShell>,
    session,
  );
  expect(
    await screen.findByText(
      "Tài khoản của bạn chưa được cấp quyền truy cập trang này.",
    ),
  ).toBeTruthy();
  // Các mục quản trị nằm ở sidebar, không còn trên header.
  const sidebar = screen.getByRole("complementary", {
    name: "Thanh điều hướng",
  });
  const admin = within(sidebar).getByRole("navigation", {
    name: "Điều hướng quản trị",
  });
  expect(within(admin).queryByRole("link", { name: "Người dùng" })).toBeNull();
  for (const name of ["Tổng quan", "Đơn vị", "Team"])
    expect(within(admin).getByRole("link", { name })).toBeTruthy();
  const header = sidebar.parentElement!.querySelector("header")!;
  expect(within(header).queryByRole("link", { name: "Đơn vị" })).toBeNull();
  const back = within(header).getByRole("link", {
    name: "Về không gian làm việc",
  });
  expect(back.getAttribute("href")).toBe("/workspace");
  // Khu quản trị không có bộ chọn dự án.
  expect(screen.queryByRole("button", { name: /^Dự án:/ })).toBeNull();
});

it("keeps administration out of the work area for people without administration permissions", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/admin/teams");
  show(
    <AdminShell>
      <TeamsPage />
    </AdminShell>,
    session,
  );
  expect(
    await screen.findByText(
      "Tài khoản của bạn chưa được cấp quyền truy cập trang này.",
    ),
  ).toBeTruthy();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Mở menu tài khoản" }));
  const menu = await screen.findByRole("menu");
  expect(
    within(menu).queryByRole("menuitem", { name: "Quản trị hệ thống" }),
  ).toBeNull();
});

it("lets a multi-role account switch between the work area and administration without signing in again", async () => {
  const session = await login("admin");
  history.replaceState(null, "", "/workspace");
  const user = userEvent.setup();
  show(
    <WorkspaceShell>
      <span>Trang chủ</span>
    </WorkspaceShell>,
    session,
  );
  await user.click(screen.getByRole("button", { name: "Mở menu tài khoản" }));
  const toAdmin = within(await screen.findByRole("menu")).getByRole(
    "menuitem",
    {
      name: "Quản trị hệ thống",
    },
  );
  expect(toAdmin.getAttribute("href")).toBe("/admin");
  cleanup();
  history.replaceState(null, "", "/admin/users");
  show(
    <AdminShell>
      <span>Quản trị</span>
    </AdminShell>,
    session,
  );
  await user.click(screen.getByRole("button", { name: "Mở menu tài khoản" }));
  const toWork = within(await screen.findByRole("menu")).getByRole("menuitem", {
    name: "Về không gian làm việc",
  });
  expect(toWork.getAttribute("href")).toBe("/workspace");
  expect(token.get()).not.toBeNull();
});
it.each([
  { username: "lan", path: "/dashboard", page: <DashboardPage /> },
  { username: "lan", path: "/reviews", page: <ReviewsPage /> },
  { username: "admin", path: "/reviews", page: <ReviewsPage /> },
  { username: "minh", path: "/admin/users", page: <UsersPage /> },
  { username: "admin", path: "/projects/new", page: <ProjectEditorPage /> },
])(
  "blocks direct access to $path for $username before mounting its data queries",
  async ({ username, path, page }) => {
    if (username === "admin") accountAdminOnly();
    const session = await login(username);
    history.replaceState(null, "", path);
    const requests: string[] = [];
    const observe = ({ request }: { request: Request }) => {
      requests.push(request.url);
    };
    server.events.on("request:start", observe);
    try {
      show(<WorkspaceShell>{page}</WorkspaceShell>, session);
      expect(
        await screen.findByText(
          "Tài khoản của bạn chưa được cấp quyền truy cập trang này.",
        ),
      ).toBeTruthy();
      expect(requests.map((url) => new URL(url).pathname)).toEqual([
        "/api/notifications/summary",
      ]);
      if (username !== "minh") {
        // Không ai ngoài người nghiệm thu thấy Nghiệm thu; Phân tích chỉ có ở tài
        // khoản có ANALYTICS_VIEW (accountAdminOnly đã thu hồi quyền này của Admin).
        expect(screen.queryByRole("link", { name: "Nghiệm thu" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Phân tích" })).toBeNull();
      }
    } finally {
      server.events.removeListener("request:start", observe);
    }
  },
);
it("shows an API scope denial, clears old data and retains the error without refetching forever", async () => {
  const session = await login("minh");
  let reads = 0;
  const observe = ({ request }: { request: Request }) => {
    if (new URL(request.url).pathname === "/api/alerts/alert-1") reads++;
  };
  function AlertProbe() {
    const query = useGetAlertQuery("alert-1");
    return (
      <span>
        {query.isError
          ? query.error.message
          : query.data
            ? "alert-ready"
            : "waiting"}
      </span>
    );
  }
  server.events.on("request:start", observe);
  try {
    const client = show(<AlertProbe />, session);
    await screen.findByText("alert-ready");
    for (const member of db.members.filter(
      (member) => member.userId === session.user.id,
    ))
      member.projectRole = "MEMBER";
    // Cảnh báo không còn là tài nguyên chặn theo quyền (người không nhận được 404), nên giả lập 403 để giữ kiểm tra xử lý từ chối phạm vi
    const denial = "Bạn không có quyền xem dữ liệu này.";
    server.use(
      http.get("*/api/alerts/alert-1", () =>
        HttpResponse.json(
          { code: "FORBIDDEN", message: denial },
          { status: 403 },
        ),
      ),
    );
    await act(async () => {
      await client.invalidateQueries({
        queryKey: alertsKeys.getAlert(session.user.id, "alert-1"),
      });
    });
    await screen.findByText(denial);
    await waitFor(() => {
      const current = client.getQueryData<SessionDto>(
        authKeys.getSession(session.user.id),
      );
      expect(
        current?.projectAccess.some((project) =>
          project.permissions.includes("ANALYTICS_VIEW"),
        ),
      ).toBe(false);
    });
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(
      client.getQueryState(alertsKeys.getAlert(session.user.id, "alert-1")),
    ).toMatchObject({
      status: "error",
      data: undefined,
      error: { status: 403 },
    });
    expect(reads).toBe(2);
  } finally {
    server.events.removeListener("request:start", observe);
  }
});

it("retains an expired analysis error without repeatedly reloading the snapshot", async () => {
  const session = await login("minh");
  let reads = 0;
  server.use(
    http.get("*/api/analytics/details/expired", () => {
      reads++;
      return HttpResponse.json(
        { code: "SNAPSHOT_EXPIRED", message: "Dữ liệu phân tích đã hết hạn." },
        { status: 410 },
      );
    }),
  );
  function AnalysisProbe() {
    const query = useGetAnalysisDetailQuery("expired");
    return <span>{query.isError ? query.error.message : "waiting"}</span>;
  }
  const client = show(<AnalysisProbe />, session);
  await screen.findByText("Dữ liệu phân tích đã hết hạn.");
  await waitFor(() => expect(client.isFetching()).toBe(0));
  expect(
    client.getQueryState(
      analyticsKeys.getAnalysisDetail(session.user.id, "expired"),
    ),
  ).toMatchObject({ status: "error", data: undefined, error: { status: 410 } });
  expect(reads).toBe(1);
});

it("clears the previous report author and page when switching projects", async () => {
  grantSystemAnalytics("u-admin");
  const session = await login("admin");
  history.replaceState(
    null,
    "",
    "/reports?projectId=p-main&authorId=u-lan&page=3&status=SUBMITTED",
  );
  show(<ReportsPage />, session);
  const project = screen.getByRole("combobox", { name: "Dự án" });
  await within(project).findByRole("option", { name: "Dự án ngoài phạm vi" });
  await userEvent.setup().selectOptions(project, "p-other");
  const params = new URLSearchParams(nav.replace.mock.calls.at(-1)?.[0]);
  expect(params.get("projectId")).toBe("p-other");
  expect(params.has("authorId")).toBe(false);
  expect(params.has("page")).toBe(false);
  expect(params.get("status")).toBe("SUBMITTED");
});

it("keeps project unit options available when search results are empty", async () => {
  grantSystemAnalytics("u-admin");
  const session = await login("admin");
  history.replaceState(null, "", "/projects?q=no-project-matches");
  show(<ProjectsPage />, session);
  await screen.findByText("Chưa có dữ liệu");
  const unit = screen.getByRole("combobox", { name: "Đơn vị" });
  expect(
    await within(unit).findByRole("option", { name: "Phòng kỹ thuật" }),
  ).toBeTruthy();
  expect(
    within(unit).getByRole("option", { name: "Phòng sản phẩm" }),
  ).toBeTruthy();
});

it("shows an owner lookup failure before opening the project edit form", async () => {
  const session = await login("minh");
  server.use(
    http.get("*/api/projects/p-main/members", () =>
      HttpResponse.json(
        { code: "UNAVAILABLE", message: "Không tải được thành viên dự án." },
        { status: 503 },
      ),
    ),
  );
  show(<ProjectEditorPage projectId="p-main" />, session);
  await screen.findByText("Không tải được thành viên dự án.");
  expect(screen.queryByRole("textbox", { name: "Tên dự án *" })).toBeNull();
});

it.each(["lock", "unlock", "password"] as const)(
  "keeps the version and draft for account %s until the newer data is explicitly accepted",
  async (action) => {
    const session = await login("admin");
    let person = await usersService.createUser(
      {
        username: "conflict.user",
        displayName: "Người kiểm thử",
        email: "conflict.user@example.test",
        unitId: "unit-product",
        initialPassword: "Start@12345",
      },
      { key: "create-conflict-user" },
    );
    if (action === "unlock")
      person = await usersService.lockUser(
        person.id,
        { mode: "NORMAL", reason: "Khóa trước khi mở lại" },
        { key: "lock-before-test", version: person.version },
      );
    at(`/admin/users?dialog=view&id=${person.id}`);
    const client = show(<UsersPage />, session);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name:
          action === "password"
            ? "Cấp lại mật khẩu"
            : action === "unlock"
              ? "Mở khóa tài khoản"
              : "Khóa tài khoản",
      }),
    );
    if (action === "password")
      await user.type(screen.getByLabelText("Mật khẩu tạm *"), "Reset@12345");
    const reason = screen.getByRole("textbox", { name: "Lý do *" });
    await user.type(reason, "Nội dung được giữ lại");
    const updated = await usersService.updateUser(
      person.id,
      { displayName: "Tên từ phiên khác" },
      { version: person.version, key: "concurrent-user-name" },
    );
    await act(async () => {
      await client.invalidateQueries({
        queryKey: usersKeys.getUser(session.user.id, person.id),
      });
    });
    await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
    await user.click(
      await screen.findByRole("button", { name: "Tải bản mới để đối chiếu" }),
    );
    await screen.findByText("Bản mới nhất — nội dung bạn nhập được giữ lại");
    expect(reason).toHaveProperty("value", "Nội dung được giữ lại");
    await user.click(
      screen.getByRole("button", { name: "Đã đối chiếu, tiếp tục chỉnh sửa" }),
    );
    await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: "Lý do *" })).toBeNull(),
    );
    const saved = await usersService.getUser(person.id);
    expect(saved.version).toBeGreaterThan(updated.version);
    expect(saved.status).toBe(action === "lock" ? "LOCKED" : "ACTIVE");
    if (action === "password") {
      await authService.login({
        username: person.username,
        password: "Reset@12345",
      });
    }
  },
);

it.each(["unit", "team"] as const)(
  "preserves the deactivation reason for %s through a version conflict",
  async (kind) => {
    const session = await login("admin");
    const entity =
      kind === "unit"
        ? await organizationService.createUnit(
            { name: "Đơn vị trống", parentId: null, managerId: null },
            { key: "new-empty-unit" },
          )
        : await organizationService.createTeam(
            { name: "Nhóm trống", unitId: "unit-product", memberIds: [] },
            { key: "new-empty-team" },
          );
    at(
      `/admin/${kind === "unit" ? "organization" : "teams"}?dialog=view&id=${entity.id}`,
    );
    show(kind === "unit" ? <OrganizationPage /> : <TeamsPage />, session);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name: kind === "unit" ? "Ngừng sử dụng đơn vị" : "Ngừng sử dụng nhóm",
      }),
    );
    const reason = screen.getByRole("textbox", {
      name: "Lý do ngừng sử dụng *",
    });
    await user.type(reason, "Không còn sử dụng");
    const patch = { name: "Tên cập nhật đồng thời", reason: "Điều chỉnh tên" };
    const options = {
      version: entity.version,
      key: "rename-before-deactivate",
    };
    if (kind === "unit")
      await organizationService.updateUnit(entity.id, patch, options);
    else await organizationService.updateTeam(entity.id, patch, options);
    await user.click(
      screen.getByRole("button", { name: "Xác nhận ngừng sử dụng" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Tải bản mới để đối chiếu" }),
    );
    await screen.findByText("Bản mới nhất — nội dung bạn nhập được giữ lại");
    expect(reason).toHaveProperty("value", "Không còn sử dụng");
    await user.click(
      screen.getByRole("button", { name: "Đã đối chiếu, tiếp tục chỉnh sửa" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Xác nhận ngừng sử dụng" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "Lý do ngừng sử dụng *" }),
      ).toBeNull(),
    );
    const saved =
      kind === "unit"
        ? await organizationService.getUnit(entity.id)
        : await organizationService.getTeam(entity.id);
    expect(saved.status).toBe("INACTIVE");
    expect(saved.version).toBe(entity.version + 2);
  },
);

it("reloads the membership version before retrying an end-membership conflict", async () => {
  const session = await login("minh");
  const member = await projectMembersService.addProjectMember(
    "p-main",
    { userId: "u-other", projectRole: "MEMBER" },
    { key: "add-ending-member" },
  );
  show(<ProjectMembersPage projectId="p-main" />, session);
  const user = userEvent.setup();
  const row = (
    await screen.findByRole("link", {
      name: "Xem hồ sơ công khai của Người dùng dự án khác",
    })
  ).closest("tr")!;
  await user.click(
    within(row).getByRole("button", { name: "Thao tác Người dùng dự án khác" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Kết thúc" }));
  const reason = screen.getByRole("textbox", { name: "Lý do kết thúc *" });
  await user.type(reason, "Hoàn tất bàn giao");
  await projectMembersService.updateProjectMemberRole(
    "p-main",
    member.id,
    { projectRole: "MANAGER", reason: "Thay đổi đồng thời" },
    { version: member.version, key: "concurrent-member-role" },
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận kết thúc" }));
  await user.click(
    await screen.findByRole("button", { name: "Tải bản mới để đối chiếu" }),
  );
  await screen.findByText("Bản mới nhất — nội dung bạn nhập được giữ lại");
  expect(reason).toHaveProperty("value", "Hoàn tất bàn giao");
  await user.click(
    screen.getByRole("button", { name: "Đã đối chiếu, tiếp tục chỉnh sửa" }),
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận kết thúc" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const saved = (
    await projectMembersService.listProjectMembers("p-main")
  ).items.find((item) => item.id === member.id)!;
  expect(saved.endedAt).not.toBeNull();
  expect(saved.version).toBe(member.version + 2);
});

it("retains a review comment through 412 and uses the reloaded submission version", async () => {
  const session = await login("minh");
  history.replaceState(null, "", "/tasks/t-4");
  show(
    <TaskShell taskId="t-4">
      <span />
    </TaskShell>,
    session,
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "Quyết định nghiệm thu" }),
  );
  const comment = screen.getByRole("textbox", { name: "Nhận xét" });
  await user.type(comment, "Đã đối chiếu kết quả");
  const submission = db.submissions.find((item) => item.id === "s-pending")!;
  submission.version++;
  await user.click(screen.getByRole("button", { name: "Xác nhận quyết định" }));
  await user.click(
    await screen.findByRole("button", { name: "Tải bản mới để đối chiếu" }),
  );
  await screen.findByText("Bản mới nhất — nội dung bạn nhập được giữ lại");
  expect(comment).toHaveProperty("value", "Đã đối chiếu kết quả");
  await user.click(
    screen.getByRole("button", { name: "Đã đối chiếu, tiếp tục chỉnh sửa" }),
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận quyết định" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/tasks/t-4"));
  expect(
    db.submissions.find((item) => item.id === submission.id),
  ).toMatchObject({
    status: "ACCEPTED",
    reviewComment: "Đã đối chiếu kết quả",
    version: 3,
  });
});

it("does not load the author lookup when the report author filter is hidden", async () => {
  const session = await login("lan");
  history.replaceState(null, "", "/reports?projectId=p-main");
  const reads: string[] = [];
  const observe = ({ request }: { request: Request }) =>
    reads.push(new URL(request.url).pathname);
  server.events.on("request:start", observe);
  try {
    show(<ReportsPage />, session);
    await screen.findByRole("table");
    expect(screen.queryByRole("combobox", { name: "Người lập" })).toBeNull();
    expect(reads).not.toContain("/api/projects/p-main/members");
  } finally {
    server.events.removeListener("request:start", observe);
  }
});

it("limits the assignee lookup to a team while retaining project owner options", async () => {
  const session = await login("minh");
  history.replaceState(
    null,
    "",
    "/dashboard?projectId=p-main&teamId=team-main&from=2026-10-01&to=2026-10-25",
  );
  show(<DashboardPage />, session);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Bộ lọc" }));
  await user.click(screen.getByText("Bộ lọc khác"));
  const owner = screen.getByRole("combobox", { name: "Phụ trách dự án" });
  const assignee = screen.getByRole("combobox", { name: "Nhân viên" });
  expect(
    await within(owner).findByRole("option", { name: "Nguyễn Minh" }),
  ).toBeTruthy();
  await within(assignee).findByRole("option", { name: "Trần Lan" });
  expect(
    within(assignee).queryByRole("option", { name: "Nguyễn Minh" }),
  ).toBeNull();
});

it.each(["unit", "team"] as const)(
  "does not describe missing active-user labels as empty organization data for %s",
  async (kind) => {
    const session = await login("admin");
    for (const person of db.users.filter((person) =>
      ["u-pm", "u-lan", "u-huy"].includes(person.id),
    ))
      person.status = "LOCKED";
    at(
      kind === "unit"
        ? "/admin/organization?dialog=view&id=unit-product"
        : "/admin/teams?dialog=view&id=team-main",
    );
    show(kind === "unit" ? <OrganizationPage /> : <TeamsPage />, session);
    if (kind === "unit") {
      await screen.findByText("Chưa tải được thông tin người quản lý");
      expect(screen.queryByText("Chưa phân công")).toBeNull();
    } else {
      await screen.findByText("2 thành viên");
      expect(screen.queryByText("Chưa có thành viên")).toBeNull();
    }
  },
);

it("lets an administrator open any project, task list and analytics as read-only, with no create or edit action", async () => {
  const session = await login("admin");
  history.replaceState(null, "", "/projects/p-main");
  show(
    <WorkspaceShell>
      <ProjectShell projectId="p-main">
        <ProjectDetailPage projectId="p-main" />
      </ProjectShell>
    </WorkspaceShell>,
    session,
  );
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Cổng quản lý nội bộ",
    }),
  ).toBeTruthy();
  // Chỉ xem: không có triển khai, chỉnh sửa kế hoạch hay kết thúc dự án.
  expect(screen.queryByRole("button", { name: "Triển khai dự án" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Cài đặt dự án" })).toBeNull();
  cleanup();
  history.replaceState(null, "", "/tasks");
  show(
    <WorkspaceShell>
      <TaskListPage />
    </WorkspaceShell>,
    session,
  );
  expect(
    await screen.findByRole("link", { name: "Thiết kế luồng giao việc" }),
  ).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Tạo công việc" })).toBeNull();
  cleanup();
  history.replaceState(null, "", "/dashboard");
  show(
    <WorkspaceShell>
      <DashboardPage />
    </WorkspaceShell>,
    session,
  );
  expect(
    await screen.findByRole("heading", { name: "Bảng tổng quan" }),
  ).toBeTruthy();
  expect(
    screen.queryByText(
      "Tài khoản của bạn chưa được cấp quyền truy cập trang này.",
    ),
  ).toBeNull();
});
