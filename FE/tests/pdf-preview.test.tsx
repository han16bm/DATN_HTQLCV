// @vitest-environment jsdom
import { TaskDetailPage } from "@/features/tasks/components/task-detail-page";
import { SubmissionDetailPage } from "@/features/submissions/components/submission-detail-page";
import { authKeys } from "@/features/auth/api/auth.keys";
import { authService } from "@/features/auth/api/auth.service";
import { type SessionDto } from "@/features/auth/types/auth.types";
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
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Blob as NodeBlob } from "node:buffer";
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
const created = vi.hoisted(() => ({
  urls: [] as string[],
  revoked: [] as string[],
}));
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
beforeEach(async () => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => {
        const url = `blob:http://localhost/${crypto.randomUUID()}`;
        created.urls.push(url);
        return url;
      });
      static revokeObjectURL = vi.fn((url: string) => {
        created.revoked.push(url);
      });
    },
  );
  created.urls.length = 0;
  created.revoked.length = 0;
  resetMockState();
  // jsdom Blob không có stream(); phản hồi giả lập cần Blob của Node.
  for (const [id, blob] of db.files)
    db.files.set(
      id,
      new NodeBlob([await blob.arrayBuffer()], { type: blob.type }) as Blob,
    );
  server.resetHandlers();
  token.set(null);
  registerRefresh(null);
  useUI.getState().reset();
  history.replaceState(null, "", "/tasks/t-4");
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
function show(
  session: SessionDto,
  content: ReactNode = <TaskDetailPage taskId="t-4" />,
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <Provider session={session}>{content}</Provider>
    </QueryClientProvider>,
  );
}

it("shows the manager an inline PDF preview of the latest submitted report", async () => {
  show(await login("minh"));
  const panel = (await screen.findByText("Báo cáo kết quả")).closest(
    "section",
  )!;
  expect(await within(panel).findByText("flow.pdf")).toBeTruthy();
  const frame = await within(panel).findByTitle("Xem trước flow.pdf");
  expect(frame.tagName).toBe("IFRAME");
  expect(frame.getAttribute("src")).toMatch(/^blob:/);
  expect(
    within(panel)
      .getByRole("link", { name: /Mở tab mới/ })
      .getAttribute("href"),
  ).toBe(frame.getAttribute("src"));
  // Thu gọn thì bỏ khung và thu hồi địa chỉ tạm.
  await userEvent
    .setup()
    .click(within(panel).getByRole("button", { name: "Thu gọn" }));
  expect(within(panel).queryByTitle("Xem trước flow.pdf")).toBeNull();
  expect(created.revoked).toContain(created.urls[0]);
});

it("shows the submitted report to its employee author who can view the task", async () => {
  show(await login("huy"));
  expect(await screen.findByTitle("Xem trước flow.pdf")).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Báo cáo đính kèm" }),
  ).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

it.each(["minh", "lan"])(
  "keeps an empty report frame for %s before any submission without requesting a missing file",
  async (username) => {
    const session = await login(username);
    const paths: string[] = [];
    const observe = ({ request }: { request: Request }) =>
      paths.push(new URL(request.url).pathname);
    server.events.on("request:start", observe);
    try {
      show(session, <TaskDetailPage taskId="t-2" />);
      const heading = await screen.findByRole("heading", {
        name: "Báo cáo đính kèm",
      });
      const panel = heading.closest("section")!;
      expect(within(panel).getByText("Chưa có báo cáo đính kèm.")).toBeTruthy();
      expect(panel.querySelector(".panel-body .pdf-empty")).toBeTruthy();
      expect(panel.querySelector("iframe")).toBeNull();
      expect(within(panel).queryByRole("button")).toBeNull();
      expect(paths.some((path) => path.includes("/attachments/"))).toBe(false);
    } finally {
      server.events.removeListener("request:start", observe);
    }
  },
);

it.each(["other", "lan"])(
  "does not request the report or files when task access is forbidden for %s",
  async (username) => {
    const session = await login(username);
    const paths: string[] = [];
    const observe = ({ request }: { request: Request }) =>
      paths.push(new URL(request.url).pathname);
    server.events.on("request:start", observe);
    try {
      show(session);
      await screen.findByRole("heading", { name: "Bạn chưa được cấp quyền" });
      expect(
        screen.queryByRole("heading", { name: "Báo cáo đính kèm" }),
      ).toBeNull();
      expect(
        paths.some((path) => /\/(submissions|attachments)(\/|$)/.test(path)),
      ).toBe(false);
    } finally {
      server.events.removeListener("request:start", observe);
    }
  },
);

it.each([
  ["task", "minh"],
  ["submission", "minh"],
  ["task", "huy"],
  ["submission", "huy"],
])(
  "keeps the report frame when the %s view for %s has no attachment",
  async (view, username) => {
    db.submissions.find((item) => item.id === "s-pending")!.attachmentIds = [];
    show(
      await login(username),
      view === "task" ? (
        <TaskDetailPage taskId="t-4" />
      ) : (
        <SubmissionDetailPage taskId="t-4" submissionId="s-pending" />
      ),
    );
    const heading = await screen.findByRole("heading", {
      name: "Báo cáo đính kèm",
    });
    const panel = heading.closest("section")!;
    expect(within(panel).getByText("Chưa có báo cáo đính kèm.")).toBeTruthy();
    expect(panel.querySelector("iframe")).toBeNull();
    expect(within(panel).queryByRole("button")).toBeNull();
    expect(created.urls).toHaveLength(0);
  },
);

it("requests the PDF content again and opens it after a malformed response recovers", async () => {
  let attempts = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.get("*/api/attachments/a-flow/content", async () => {
      if (++attempts === 1) return HttpResponse.json({ invalid: true });
      await ready;
    }),
  );
  show(await login("minh"));
  const error = await screen.findByRole("alert");
  expect(within(error).getByText(/Chưa thể tải tệp/)).toBeTruthy();
  await userEvent
    .setup()
    .click(within(error).getByRole("button", { name: "Thử tải lại" }));
  await waitFor(() => expect(attempts).toBe(2));
  expect(await screen.findByText("Đang tải bản xem trước…")).toBeTruthy();
  release();
  expect(await screen.findByTitle("Xem trước flow.pdf")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(attempts).toBe(2);
});

it("keeps the file picker available when the selected attachment no longer exists", async () => {
  const latest = db.submissions.find((item) => item.id === "s-pending")!;
  latest.attachmentIds = ["a-missing", "a-flow"];
  show(await login("minh"));
  const panel = (await screen.findByText("Báo cáo kết quả")).closest(
    "section",
  )!;
  await within(panel).findByRole("heading", {
    name: "Không tìm thấy nội dung",
  });
  const picker = within(panel).getByRole("combobox", { name: "Tệp báo cáo" });
  await userEvent.setup().selectOptions(picker, "a-flow");
  expect(await within(panel).findByTitle("Xem trước flow.pdf")).toBeTruthy();
  expect(
    within(panel).queryByRole("heading", { name: "Không tìm thấy nội dung" }),
  ).toBeNull();
});

it("downloads the PDF content once for the preview that is open", async () => {
  const session = await login("minh");
  const paths: string[] = [];
  server.events.on("request:start", ({ request }) => {
    paths.push(new URL(request.url).pathname);
  });
  show(session);
  await screen.findByTitle("Xem trước flow.pdf");
  expect(paths.filter((path) => path.endsWith("/content"))).toHaveLength(1);
  expect(
    paths.filter((path) => path.endsWith("/attachments/a-flow")),
  ).toHaveLength(1);
});

it("lets the manager pick any submission and file from dropdowns that show only the round and time", async () => {
  const session = await login("minh");
  const pdf = db.files.get("a-flow")!;
  const latest = db.submissions.find((item) => item.id === "s-pending")!;
  latest.sequence = 2;
  latest.attachmentIds = ["a-flow", "a-extra"];
  db.submissions.push({
    ...latest,
    id: "s-first",
    sequence: 1,
    submittedAt: "2026-10-20T03:00:00.000Z",
    attachmentIds: ["a-old"],
    status: "REVISION_REQUESTED",
  });
  for (const [id, filename] of [
    ["a-extra", "extra.pdf"],
    ["a-old", "old.pdf"],
  ]) {
    db.attachments.push({
      id,
      taskId: "t-4",
      uploadedBy: "u-huy",
      filename,
      mimeType: "application/pdf",
      sizeBytes: 597,
      status: "READY",
    });
    db.files.set(id, pdf);
  }
  show(session);
  const panel = (await screen.findByText("Báo cáo kết quả")).closest(
    "section",
  )!;
  const rounds = await within(panel).findByRole("combobox", {
    name: "Lần nộp",
  });
  expect(
    within(rounds)
      .getAllByRole("option")
      .map((option) => option.textContent),
  ).toEqual([
    expect.stringMatching(/^Lần 2 · .+\(mới nhất\)$/),
    expect.stringMatching(/^Lần 1 · /),
  ]);
  // Không hiện người nộp trong khung báo cáo.
  expect(within(panel).queryByText("Nguyễn Huy")).toBeNull();
  const files = await within(panel).findByRole("combobox", {
    name: "Tệp báo cáo",
  });
  expect(
    within(files)
      .getAllByRole("option")
      .map((option) => option.textContent),
  ).toEqual(["flow.pdf", "extra.pdf"]);
  const user = userEvent.setup();
  await user.selectOptions(files, "a-extra");
  expect(await within(panel).findByTitle("Xem trước extra.pdf")).toBeTruthy();
  await user.selectOptions(rounds, "s-first");
  expect(await within(panel).findByTitle("Xem trước old.pdf")).toBeTruthy();
  expect(
    within(panel).queryByRole("combobox", { name: "Tệp báo cáo" }),
  ).toBeNull();
  expect(within(panel).queryByTitle("Xem trước extra.pdf")).toBeNull();
});

it("sorts and pages attempts without loading every document, and releases the previous preview", async () => {
  const session = await login("minh");
  const latest = db.submissions.find((item) => item.id === "s-pending")!;
  latest.sequence = 7;
  for (let sequence = 1; sequence < 7; sequence++)
    db.submissions.push({
      ...latest,
      id: `round-${sequence}`,
      sequence,
      status: "REVISION_REQUESTED",
      attachmentIds: [],
    });
  const requests: URL[] = [];
  const observe = ({ request }: { request: Request }) =>
    requests.push(new URL(request.url));
  server.events.on("request:start", observe);
  try {
    show(session);
    const panel = (await screen.findByText("Báo cáo kết quả")).closest(
      "section",
    )!;
    const frame = await within(panel).findByTitle("Xem trước flow.pdf");
    const url = frame.getAttribute("src");
    const rounds = within(panel).getByRole("combobox", { name: "Lần nộp" });
    await waitFor(() =>
      expect(within(rounds).getAllByRole("option")).toHaveLength(5),
    );
    expect((rounds as HTMLSelectElement).value).toBe("s-pending");
    const user = userEvent.setup();
    await user.selectOptions(
      within(panel).getByRole("combobox", { name: "Sắp xếp" }),
      "sequence",
    );
    await within(panel).findByText("Chưa có báo cáo đính kèm.");
    expect(
      within(panel).getByRole("heading", { name: "Báo cáo đính kèm" }),
    ).toBeTruthy();
    expect((rounds as HTMLSelectElement).value).toBe("round-1");
    expect(created.revoked).toContain(url);
    await user.click(within(panel).getByRole("button", { name: "Sau" }));
    await within(panel).findByText("Trang 2 / 2");
    expect((rounds as HTMLSelectElement).value).toBe("round-6");
    expect(within(rounds).getAllByRole("option")).toHaveLength(2);
    await user.selectOptions(rounds, "s-pending");
    await within(panel).findByTitle("Xem trước flow.pdf");
    expect(
      requests.filter((request) => request.pathname.endsWith("/content")),
    ).toHaveLength(1);
    expect(
      requests.some(
        (request) =>
          request.searchParams.get("sort") === "sequence" &&
          request.searchParams.get("page") === "2",
      ),
    ).toBe(true);
    expect(within(panel).queryByText("Nguyễn Huy")).toBeNull();
  } finally {
    server.events.removeListener("request:start", observe);
  }
});
