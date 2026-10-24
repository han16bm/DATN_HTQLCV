// @vitest-environment jsdom
import { analyticsService } from "@/features/analytics/api/analytics.service";
import { AnalysisDetailPage } from "@/features/analytics/components/analysis-detail-page";
import { EvidenceUploader } from "@/features/attachments/components/evidence";
import { authService } from "@/features/auth/api/auth.service";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { useListProjectMembersQuery } from "@/features/project-members/hooks/use-project-members-queries";
import { reportsService } from "@/features/reports/api/reports.service";
import { ReportPage } from "@/features/reports/components/report-page";
import { SubmitResultDialog } from "@/features/submissions/components/submit-result-dialog";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { TaskEditorPage } from "@/features/tasks/components/task-editor-page";
import {
  useGetTaskQuery,
  useListTasksQuery,
} from "@/features/tasks/hooks/use-tasks-queries";
import type { TaskQuery } from "@/features/tasks/types/tasks.types";
import { Session } from "@/lib/auth/session-context";
import { db } from "@/mocks/db";
import { resetMockState, server } from "@/mocks/node";
import { registerRefresh, token } from "@/services/api-client";
import { useUI } from "@/stores/ui-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
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
  cleanup();
  for (const client of clients) client.clear();
  clients.length = 0;
});
const login = (username: string) =>
  authService.login({ username, password: "Mock@12345" });
it("displays the upload policy from HTTP and rejects oversized files before posting", async () => {
  const session = await login("lan");
  server.use(
    http.get("*/api/v1/attachments/policy", () =>
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
      new URL(request.url).pathname === "/api/v1/attachments"
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
      <Session
        value={{
          session,
          loading: false,
          refresh: async () => {},
          signIn: async () => {},
          signOut: async () => {},
        }}
      >
        {children}
      </Session>
    </QueryClientProvider>
  );
  render(strict ? <StrictMode>{content}</StrictMode> : content);
  return client;
}
it("shares one cache entry and HTTP request for equivalent normalized task filters", async () => {
  const session = await login("minh");
  const urls: URL[] = [];
  const observe = ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    if (url.pathname === "/api/v1/tasks") urls.push(url);
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
        "/api/v1/tasks/t-3",
        "/api/v1/projects/p-main/members",
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
      new URL(request.url).pathname === "/api/v1/analytics/jobs"
    )
      posts++;
  };
  server.events.on("request:start", observe);
  try {
    show(<AnalysisDetailPage analysisId={id} />, session, true);
    await screen.findByRole("heading", { name: "Tổng hợp theo số liệu" });
    await waitFor(() => expect(posts).toBe(1));
    expect(
      screen.getByRole("heading", { name: "Thông số và cách tính" }),
    ).toBeTruthy();
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
      new URL(request.url).pathname === "/api/v1/report-previews"
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
      name: "Đã đối chiếu, dùng phiên bản mới để lưu",
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
      name: "Đã đối chiếu, dùng phiên bản mới để lưu",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Xác nhận nộp" }));
  await waitFor(() =>
    expect(db.tasks.find((t) => t.id === "t-3")?.status).toBe("PENDING_REVIEW"),
  );
});
