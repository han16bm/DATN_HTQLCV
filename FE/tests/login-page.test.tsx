// @vitest-environment jsdom
import { LoginPage } from "@/features/auth/components/login-page";
import { Session } from "@/lib/auth/session-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

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
beforeEach(() => {
  vi.clearAllMocks();
  history.replaceState(null, "", "/login");
});
afterEach(cleanup);

function show() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <Session
        value={{
          session: null,
          loading: false,
          refresh: async () => ({}) as never,
          signIn: async () => {},
          signOut: async () => {},
        }}
      >
        <LoginPage />
      </Session>
    </QueryClientProvider>,
  );
}

it("shows only the product name, the two fields and one primary action", () => {
  show();
  expect(
    screen.getByRole("heading", { level: 1, name: "Đăng nhập" }),
  ).toBeTruthy();
  expect(screen.getByLabelText("Tên đăng nhập")).toBeTruthy();
  expect(screen.getByLabelText("Mật khẩu")).toBeTruthy();
  expect(screen.getAllByRole("button")).toHaveLength(1);
  // Không có tranh minh họa hay lời giới thiệu thay cho biểu mẫu.
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByRole("main")).toBeTruthy();
});

it("names each missing field when submitting empty and does not navigate", async () => {
  show();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: /Đăng nhập/ }));
  const alerts = await screen.findAllByRole("alert");
  expect(alerts.length).toBeGreaterThanOrEqual(2);
  expect(
    screen.getByLabelText("Tên đăng nhập").getAttribute("aria-invalid"),
  ).toBe("true");
  expect(nav.replace).not.toHaveBeenCalled();
});

it("explains an expired session instead of the usual hint", () => {
  history.replaceState(null, "", "/login?next=%2Ftasks&expired=1");
  show();
  expect(
    screen.getByText("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."),
  ).toBeTruthy();
  expect(
    screen.queryByText("Sử dụng tài khoản nội bộ đã được cấp."),
  ).toBeNull();
});
