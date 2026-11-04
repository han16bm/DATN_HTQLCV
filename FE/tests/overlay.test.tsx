// @vitest-environment jsdom
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ModalHeader, modalClass, slideDrawerClass } from "@/components/ui/overlay";
import { useUI } from "@/stores/ui-store";
import * as Dialog from "@radix-ui/react-dialog";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";

beforeEach(() => useUI.getState().reset());
afterEach(cleanup);

function ask(message: string) {
  let answer!: Promise<boolean>;
  act(() => {
    answer = useUI.getState().confirm(message);
  });
  return answer;
}

it("asks before discarding, focuses the safe choice first and resolves with the answer", async () => {
  const user = userEvent.setup();
  render(<ConfirmDialog />);
  const stay = ask("Bạn có dữ liệu chưa lưu. Bỏ thay đổi để rời trang?");
  const dialog = await screen.findByRole("alertdialog", {
    name: "Thay đổi chưa được lưu",
  });
  expect(dialog.textContent).toContain("Bỏ thay đổi để rời trang?");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Ở lại" }),
  );
  // Bỏ thay đổi làm mất dữ liệu nên dùng nút Danger.
  expect(
    screen.getByRole("button", { name: "Bỏ thay đổi" }).className,
  ).toContain("bg-danger-bold");
  await user.click(screen.getByRole("button", { name: "Ở lại" }));
  expect(await stay).toBe(false);

  const leave = ask("Bỏ dữ liệu chưa lưu?");
  await user.click(await screen.findByRole("button", { name: "Bỏ thay đổi" }));
  expect(await leave).toBe(true);

  const escaped = ask("Bỏ dữ liệu chưa lưu?");
  await screen.findByRole("alertdialog");
  await user.keyboard("{Escape}");
  expect(await escaped).toBe(false);
});

it("names a dialog by its heading and closes it with a labelled button", async () => {
  const user = userEvent.setup();
  render(
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Content
          className={modalClass("md")}
          aria-describedby={undefined}
        >
          <ModalHeader
            title="Chọn dự án tạo công việc"
            closeLabel="Đóng biểu mẫu"
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>,
  );
  const dialog = await screen.findByRole("dialog", {
    name: "Chọn dự án tạo công việc",
  });
  expect(
    screen.getByRole("heading", { level: 2, name: "Chọn dự án tạo công việc" }),
  ).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Đóng biểu mẫu" }));
  expect(dialog.isConnected).toBe(false);
});

it("sizes modals within the viewport and keeps the drawer below the top bar", () => {
  expect(modalClass("sm")).toContain("w-[min(440px,calc(100vw-32px))]");
  expect(modalClass("md")).toContain("max-h-[90dvh]");
  expect(modalClass("sm", "confirm")).toContain("z-91");
  expect(slideDrawerClass("sm")).toContain("top-(--topbar-h)");
});
