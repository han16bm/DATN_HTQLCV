// @vitest-environment jsdom
import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { Metric, MetricStrip } from "@/components/patterns/metric";
import { SplitLayout } from "@/components/patterns/split-layout";
import { Notice } from "@/components/ui/notice";
import { PageHeader, Panel } from "@/components/ui/page";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

afterEach(cleanup);

it("names a panel region after its title so it can be found and announced", () => {
  render(
    <Panel title="Mục tiêu dự án">
      <p>Nội dung</p>
    </Panel>,
  );
  const region = screen.getByRole("region", { name: "Mục tiêu dự án" });
  expect(within(region).getByText("Nội dung")).toBeTruthy();
  expect(region.querySelector('[data-slot="panel-body"]')).toBeTruthy();
});

it("shows the page title as the single h1 with status and actions beside it", () => {
  render(
    <PageHeader
      title="Công việc"
      status={<span>Đang thực hiện</span>}
      actions={<button>Tạo công việc</button>}
    />,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Công việc" }),
  ).toBeTruthy();
  expect(screen.getByText("Đang thực hiện")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Tạo công việc" })).toBeTruthy();
});

it("pairs each label with its value in a definition list", () => {
  render(
    <KeyValueList>
      <KeyValue label="Hạn hoàn thành">06/11/2026</KeyValue>
      <KeyValue label="Dự án">Cổng nội bộ</KeyValue>
    </KeyValueList>,
  );
  const term = screen.getByText("Hạn hoàn thành");
  expect(term.tagName).toBe("DT");
  expect(term.nextElementSibling?.tagName).toBe("DD");
  expect(term.nextElementSibling?.textContent).toBe("06/11/2026");
});

it("announces errors as alerts and keeps other notices quiet, with an icon and next steps", () => {
  render(
    <>
      <Notice
        tone="danger"
        title="Chưa tải được dữ liệu"
        actions={<button>Thử lại</button>}
      >
        <p>Máy chủ không phản hồi.</p>
      </Notice>
      <Notice tone="success">Đã lưu.</Notice>
    </>,
  );
  const alert = screen.getByRole("alert");
  expect(
    within(alert).getByRole("heading", { name: "Chưa tải được dữ liệu" }),
  ).toBeTruthy();
  expect(within(alert).getByRole("button", { name: "Thử lại" })).toBeTruthy();
  expect(alert.querySelector("svg[aria-hidden='true']")).toBeTruthy();
  expect(screen.getAllByRole("alert")).toHaveLength(1);
});

it("renders a metric as a link when it leads somewhere, with its hint", () => {
  render(
    <MetricStrip aria-label="Số liệu cá nhân">
      <Metric
        label="Công việc quá hạn"
        value={3}
        hint="Xem công việc"
        href="/tasks?overdue=true"
        tone="danger"
      />
      <Metric label="Báo cáo nháp" value={1} />
    </MetricStrip>,
  );
  const strip = within(screen.getByRole("region", { name: "Số liệu cá nhân" }));
  const link = strip.getByRole("link", { name: /Công việc quá hạn/ });
  expect(link.getAttribute("href")).toBe("/tasks?overdue=true");
  expect(within(link).getByText("Xem công việc")).toBeTruthy();
  expect(strip.getAllByRole("link")).toHaveLength(1);
});

it("keeps the main content first and the side information in its own column", () => {
  const { container } = render(
    <SplitLayout aside={<aside aria-label="Thông tin công việc">Phụ</aside>}>
      <p>Chính</p>
    </SplitLayout>,
  );
  const main = screen.getByText("Chính").parentElement!;
  expect(
    main.nextElementSibling?.contains(
      screen.getByRole("complementary", { name: "Thông tin công việc" }),
    ),
  ).toBe(true);
  expect(container.querySelectorAll("aside")).toHaveLength(1);
});
