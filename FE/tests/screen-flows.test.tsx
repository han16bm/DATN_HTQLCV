// @vitest-environment jsdom
import { analyticsService } from "@/features/analytics/api/analytics.service";
import { AnalysisDetailPage } from "@/features/analytics/components/analysis-detail-page";
import { authService } from "@/features/auth/api/auth.service";
import { type SessionDto } from "@/features/auth/types/auth.types";
import { reportsService } from "@/features/reports/api/reports.service";
import { ReportPage } from "@/features/reports/components/report-page";
import { SubmitResultDialog } from "@/features/submissions/components/submit-result-dialog";
import { tasksKeys } from "@/features/tasks/api/tasks.keys";
import { tasksService } from "@/features/tasks/api/tasks.service";
import { useListTasksQuery } from "@/features/tasks/hooks/use-tasks-queries";
import type { TaskQuery } from "@/features/tasks/types/tasks.types";
import { Session } from "@/lib/auth/session-context";
import { db } from "@/mocks/db/database";
import { server } from "@/mocks/node";
import { resetMockState } from "@/mocks/reset";
import { registerRefresh, token } from "@/services/auth-session";
import { useUI } from "@/stores/ui-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  process.env.NEXT_PUBLIC_API_ORIGIN = "http://gateway.test";
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
  delete process.env.NEXT_PUBLIC_API_ORIGIN;
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
    await screen.findByText(
      "LLM mô phỏng · MSW",
      { exact: false },
      { timeout: 6000 },
    );
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
  show(<ReportPage reportId={draft.id} edit />, session);
  const achievements = await screen.findByLabelText("Kết quả thực hiện");
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
