// @vitest-environment jsdom
import { DataTable } from "@/components/patterns/data-table";
import { StatusLozenge, statusTone } from "@/components/ui/lozenge";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

afterEach(cleanup);

const props = {
  title: "Danh sách",
  headers: ["Tên", "Trạng thái"],
  rows: [
    ["Dòng một", "Mới"],
    ["Dòng hai", "Xong"],
  ],
};

it("keeps the header and shows a skeleton with a status while the first load is pending", () => {
  render(<DataTable {...props} rows={[]} loading />);
  expect(screen.getByRole("columnheader", { name: "Tên" })).toBeTruthy();
  expect(screen.getByRole("status", { name: "Đang tải dữ liệu" })).toBeTruthy();
  expect(screen.queryByText("Chưa có dữ liệu")).toBeNull();
  expect(screen.queryByText(/kết quả$/)).toBeNull();
});

it("dims the rows to 20% with a spinner while refreshing instead of removing them", () => {
  render(<DataTable {...props} loading />);
  expect(
    screen.getByRole("status", { name: "Đang cập nhật bảng" }),
  ).toBeTruthy();
  expect(screen.getByRole("table", { name: "Danh sách" }).className).toContain(
    "opacity-20",
  );
  expect(screen.getByText("Dòng một")).toBeTruthy();
  const card = screen
    .getByRole("table", { name: "Danh sách" })
    .closest('[data-slot="card"]');
  expect(card?.getAttribute("aria-busy")).toBe("true");
});

it("tells an empty table from a table emptied by filters, and offers to clear them", async () => {
  const clear = vi.fn();
  const view = render(<DataTable {...props} rows={[]} />);
  expect(screen.getByText("Chưa có dữ liệu")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Xóa bộ lọc" })).toBeNull();
  view.rerender(
    <DataTable {...props} rows={[]} filtered onClearFilters={clear} />,
  );
  expect(screen.getByText("Không có kết quả phù hợp")).toBeTruthy();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Xóa bộ lọc" }));
  expect(clear).toHaveBeenCalledTimes(1);
  view.rerender(
    <DataTable {...props} rows={[]} empty={<p>Hãy tạo dự án đầu tiên.</p>} />,
  );
  expect(screen.getByText("Hãy tạo dự án đầu tiên.")).toBeTruthy();
  expect(screen.queryByText("Chưa có dữ liệu")).toBeNull();
});

it("shows a load error with retry instead of an empty message", async () => {
  const retry = vi.fn().mockResolvedValue(undefined);
  render(
    <DataTable
      {...props}
      rows={[]}
      error={new Error("Máy chủ không phản hồi.")}
      onRetry={retry}
    />,
  );
  const alert = screen.getByRole("alert");
  expect(within(alert).getByText("Máy chủ không phản hồi.")).toBeTruthy();
  expect(screen.queryByText("Chưa có dữ liệu")).toBeNull();
  expect(screen.queryByText(/kết quả$/)).toBeNull();
  await userEvent
    .setup()
    .click(within(alert).getByRole("button", { name: "Thử tải lại" }));
  expect(retry).toHaveBeenCalledTimes(1);
});

it("exposes sorting only on columns that provide it", async () => {
  const sort = vi.fn();
  render(
    <DataTable
      {...props}
      headers={[
        { label: "Tên", sort: "ascending", onSort: sort },
        "Trạng thái",
      ]}
    />,
  );
  const name = screen.getByRole("columnheader", { name: "Tên" });
  expect(name.getAttribute("aria-sort")).toBe("ascending");
  expect(
    screen
      .getByRole("columnheader", { name: "Trạng thái" })
      .getAttribute("aria-sort"),
  ).toBeNull();
  expect(
    within(
      screen.getByRole("columnheader", { name: "Trạng thái" }),
    ).queryByRole("button"),
  ).toBeNull();
  await userEvent
    .setup()
    .click(within(name).getByRole("button", { name: "Tên" }));
  expect(sort).toHaveBeenCalledTimes(1);
});

it("maps statuses to a tone by meaning and falls back to neutral", () => {
  expect(statusTone("PENDING_REVIEW")).toBe("warning");
  expect(statusTone("IN_PROGRESS")).toBe("info");
  expect(statusTone("COMPLETED")).toBe("success");
  expect(statusTone("OVERDUE")).toBe("danger");
  expect(statusTone("DRAFT")).toBe("neutral");
  expect(statusTone("SOMETHING_NEW")).toBe("neutral");
  render(<StatusLozenge value="OVERDUE" />);
  const lozenge = screen.getByText("Quá hạn");
  expect(lozenge.className).toContain("text-danger-fg");
});
