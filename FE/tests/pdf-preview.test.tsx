// @vitest-environment jsdom
import { TaskDetailPage } from "@/features/tasks/components/task-detail-page";
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
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
function show(session: SessionDto) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <Provider session={session}>
        <TaskDetailPage taskId="t-4" />
      </Provider>
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

it("does not show the report preview to the person who submitted it", async () => {
  show(await login("huy"));
  await screen.findByText("Nội dung công việc");
  expect(screen.queryByText("Báo cáo kết quả")).toBeNull();
  expect(screen.queryByTitle("Xem trước flow.pdf")).toBeNull();
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
