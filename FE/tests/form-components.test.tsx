// @vitest-environment jsdom
import { Form } from "@/components/forms/form";
import { FormInput, FormSelect } from "@/components/forms/form-field";
import { MultiSelect } from "@/components/forms/multi-select";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";

afterEach(cleanup);

function Harness({
  onSubmit = async () => {},
  actions,
  hint,
  error,
}: {
  onSubmit?: () => Promise<unknown>;
  actions?: "end" | "start";
  hint?: string;
  error?: string;
}) {
  const form = useForm({ defaultValues: { name: "" } });
  return (
    <Form form={form} onSubmit={onSubmit} actions={actions}>
      <FormInput
        label="Tên dự án"
        required
        hint={hint}
        error={error ? { message: error } : undefined}
        {...form.register("name")}
      />
      <FormSelect
        label="Đơn vị"
        options={[{ value: "u1", label: "Khối sản phẩm" }]}
      />
    </Form>
  );
}

it("labels each field and keeps the hint until there is an error to show instead", () => {
  const view = render(<Harness hint="Tối đa 255 ký tự." />);
  const input = screen.getByRole("textbox", { name: "Tên dự án *" });
  expect(input.getAttribute("aria-invalid")).toBe("false");
  const hint = screen.getByText("Tối đa 255 ký tự.");
  expect(input.getAttribute("aria-describedby")).toBe(hint.id);
  view.rerender(
    <Harness
      hint="Tối đa 255 ký tự."
      error="Vui lòng nhập thông tin bắt buộc"
    />,
  );
  const alert = screen.getByRole("alert");
  expect(alert.textContent).toBe("Vui lòng nhập tên dự án.");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(input.getAttribute("aria-describedby")).toBe(alert.id);
  expect(screen.queryByText("Tối đa 255 ký tự.")).toBeNull();
  expect(screen.getByRole("combobox", { name: "Đơn vị" })).toBeTruthy();
});

it("puts the submit action in a bordered footer, or at the start without a border", () => {
  const view = render(<Harness />);
  const footer = () =>
    screen.getByRole("button", { name: "Lưu thông tin" }).parentElement!;
  expect(footer().className).toContain("justify-end");
  expect(footer().className).toContain("border-t");
  view.rerender(<Harness actions="start" />);
  expect(footer().className).toContain("justify-start");
  expect(footer().className).not.toContain("border-t");
});

it("shows the saving label and disables the form while submitting, then keeps the typed value on failure", async () => {
  const user = userEvent.setup();
  let reject!: (error: Error) => void;
  const onSubmit = vi.fn(
    () => new Promise<void>((_resolve, fail) => (reject = fail)),
  );
  render(<Harness onSubmit={onSubmit} />);
  await user.type(screen.getByRole("textbox"), "Cổng nội bộ");
  await user.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  const busy = await screen.findByRole("button", { name: "Đang lưu…" });
  expect(busy.matches(":disabled")).toBe(true);
  reject(new Error("Máy chủ bận."));
  expect((await screen.findAllByRole("alert"))[0].textContent).toContain(
    "Máy chủ bận.",
  );
  expect(screen.getByRole("textbox")).toHaveProperty("value", "Cổng nội bộ");
});

function Picker() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <MultiSelect
      label="Thành viên"
      value={value}
      onChange={setValue}
      options={[
        { value: "a", label: "Nguyễn An" },
        { value: "b", label: "Trần Bình" },
        { value: "c", label: "Lê Chi" },
      ]}
    />
  );
}

it("selects several items from a searchable list and summarises them on the trigger", async () => {
  const user = userEvent.setup();
  render(<Picker />);
  const trigger = screen.getByRole("button", { name: "Thành viên" });
  expect(trigger.textContent).toBe("Chọn thành viên");
  await user.click(trigger);
  const popup = within(
    await screen.findByRole("dialog", { name: "Chọn thành viên" }),
  );
  await user.type(
    popup.getByRole("textbox", { name: "Tìm thành viên" }),
    "bình",
  );
  expect(popup.queryByLabelText("Nguyễn An")).toBeNull();
  await user.click(popup.getByLabelText("Trần Bình"));
  await user.clear(popup.getByRole("textbox", { name: "Tìm thành viên" }));
  await user.click(popup.getByLabelText("Nguyễn An"));
  await user.click(popup.getByLabelText("Lê Chi"));
  expect(popup.getByText("Đã chọn 3")).toBeTruthy();
  await user.click(popup.getByRole("button", { name: "Xong" }));
  expect(screen.getByRole("button", { name: "Thành viên" }).textContent).toBe(
    "Nguyễn An, Trần Bình +1",
  );
});
