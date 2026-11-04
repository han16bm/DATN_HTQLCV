// @vitest-environment jsdom
import { FilterBar, FilterField } from "@/components/patterns/filter-bar";
import { Input, SearchInput } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Columns3, List } from "lucide-react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

afterEach(cleanup);

it("names each control by its visible label inside a named toolbar", () => {
  const search = vi.fn();
  const status = vi.fn();
  render(
    <FilterBar
      label="Bộ lọc dự án"
      tools={<button type="button">Xóa bộ lọc</button>}
    >
      <FilterField label="Tìm dự án" search>
        <SearchInput placeholder="Nhập tên…" value="" onChange={search} />
      </FilterField>
      <FilterField label="Trạng thái">
        <Select fit value="" onChange={status}>
          <option value="">Tất cả</option>
          <option value="ACTIVE">Đang thực hiện</option>
        </Select>
      </FilterField>
      <FilterField label="Từ ngày">
        <Input type="date" />
      </FilterField>
    </FilterBar>,
  );
  const bar = within(screen.getByRole("region", { name: "Bộ lọc dự án" }));
  fireEvent.change(bar.getByRole("searchbox", { name: "Tìm dự án" }), {
    target: { value: "cổng" },
  });
  expect(search).toHaveBeenCalledTimes(1);
  fireEvent.change(bar.getByRole("combobox", { name: "Trạng thái" }), {
    target: { value: "ACTIVE" },
  });
  expect(status).toHaveBeenCalledTimes(1);
  expect(bar.getByLabelText("Từ ngày")).toBeTruthy();
  expect(bar.getByRole("button", { name: "Xóa bộ lọc" })).toBeTruthy();
});

it("keeps new controls out of the legacy element styles", () => {
  render(
    <>
      <Input aria-label="Tên" aria-invalid="true" />
      <Select aria-label="Loại">
        <option>A</option>
      </Select>
    </>,
  );
  expect(screen.getByLabelText("Tên").hasAttribute("data-ui")).toBe(true);
  expect(screen.getByLabelText("Tên").className).toContain(
    "aria-invalid:border-danger-bold",
  );
  expect(
    screen.getByRole("combobox", { name: "Loại" }).hasAttribute("data-ui"),
  ).toBe(true);
});

it("names icon view buttons and keeps their selected state when switching", async () => {
  const change = vi.fn();
  const options = [
    { value: "", label: "Danh sách", icon: List },
    { value: "board", label: "Bảng trạng thái", icon: Columns3 },
  ];
  const view = render(
    <SegmentedControl
      label="Chế độ xem"
      value=""
      options={options}
      onChange={change}
    />,
  );
  const group = within(screen.getByRole("group", { name: "Chế độ xem" }));
  expect(group.getByRole("button", { name: "Danh sách" }).title).toBe("Danh sách");
  expect(group.getByRole("button", { name: "Bảng trạng thái" }).title).toBe("Bảng trạng thái");
  expect(
    group
      .getByRole("button", { name: "Danh sách" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(
    group
      .getByRole("button", { name: "Bảng trạng thái" })
      .getAttribute("aria-pressed"),
  ).toBe("false");
  await userEvent
    .setup()
    .click(group.getByRole("button", { name: "Bảng trạng thái" }));
  expect(change).toHaveBeenCalledWith("board");
  view.rerender(
    <SegmentedControl
      label="Chế độ xem"
      value="board"
      options={options}
      onChange={change}
    />,
  );
  expect(
    group
      .getByRole("button", { name: "Bảng trạng thái" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});
