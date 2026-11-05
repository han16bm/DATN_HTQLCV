// @vitest-environment jsdom
import { PreferencesSync } from "@/components/layout/preferences-sync";
import { SettingsPanel } from "@/components/layout/settings-panel";
import {
  applyPreferences,
  defaultPreferences,
  preferencesKey,
  usePreferences,
} from "@/stores/preferences-store";
import { useUI } from "@/stores/ui-store";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";

beforeEach(() => {
  localStorage.clear();
  act(() => usePreferences.getState().reset());
  useUI.getState().reset();
  applyPreferences(document.documentElement, defaultPreferences);
});
afterEach(cleanup);

function show() {
  render(
    <>
      <PreferencesSync />
      <SettingsPanel />
    </>,
  );
}
const open = async () => {
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Cài đặt giao diện" }));
  return within(await screen.findByRole("dialog"));
};
const fontValue = (panel: ReturnType<typeof within>) =>
  (panel.getByRole("combobox", { name: "Phông chữ" }) as HTMLSelectElement)
    .value;
const checked = (panel: ReturnType<typeof within>, name: string) =>
  panel.getByRole("radio", { name }).getAttribute("aria-checked");

it("opens a named drawer with the settings the app really supports", async () => {
  show();
  const panel = await open();
  expect(
    panel.getByRole("heading", { name: "Cài đặt giao diện" }),
  ).toBeTruthy();
  for (const name of ["Thu gọn thanh bên", "Ẩn thanh bên", "Bảng gọn"])
    expect(panel.getByRole("switch", { name })).toBeTruthy();
  expect(panel.getByRole("combobox", { name: "Cỡ chữ" })).toBeTruthy();
  expect(panel.getByRole("combobox", { name: "Phông chữ" })).toBeTruthy();
  const colors = panel.getByRole("radiogroup", { name: "Màu chủ đạo" });
  expect(within(colors).getAllByRole("radio")).toHaveLength(15);
  expect(
    panel.getByRole("radiogroup", { name: "Chế độ giao diện" }),
  ).toBeTruthy();
  expect(panel.getByRole("radiogroup", { name: "Nền trang" })).toBeTruthy();
  expect(fontValue(panel)).toBe("be-vietnam");
  expect(checked(panel, "Mặc định")).toBe("true");
  expect(checked(panel, "Xanh dương")).toBe("true");
  expect(checked(panel, "Xanh nhạt")).toBe("true");
  expect(screen.getByRole("dialog", { name: "Cài đặt giao diện" })).toBeTruthy();
});

it.each([
  { scale: "large", size: "112.5%" },
  { scale: "xlarge", size: "125%" },
])("applies $scale text and the other choices at once and remembers them", async ({ scale, size }) => {
  show();
  const panel = await open();
  const user = userEvent.setup();
  await user.click(panel.getByRole("radio", { name: "Xanh navy" }));
  await user.click(panel.getByRole("radio", { name: "Xám" }));
  await user.click(panel.getByRole("radio", { name: "Sáng" }));
  await user.selectOptions(
    panel.getByRole("combobox", { name: "Phông chữ" }),
    "Inter",
  );
  await user.selectOptions(
    panel.getByRole("combobox", { name: "Cỡ chữ" }),
    scale,
  );
  await user.click(panel.getByRole("switch", { name: "Bảng gọn" }));
  await user.click(panel.getByRole("switch", { name: "Thu gọn thanh bên" }));
  const root = document.documentElement;
  expect(root.dataset.theme).toBe("navy");
  expect(root.dataset.page).toBe("gray");
  expect(root.dataset.mode).toBe("light");
  expect(root.dataset.font).toBe("inter");
  expect(root.dataset.density).toBe("compact");
  expect(root.style.fontSize).toBe(size);
  expect(useUI.getState().sidebarCollapsed).toBe(true);
  expect(checked(panel, "Xanh navy")).toBe("true");
  expect(checked(panel, "Xám")).toBe("true");
  expect(checked(panel, "Sáng")).toBe("true");
  expect(fontValue(panel)).toBe("inter");
  expect(
    (panel.getByRole("combobox", { name: "Cỡ chữ" }) as HTMLSelectElement)
      .value,
  ).toBe(scale);
  const saved = JSON.parse(localStorage.getItem(preferencesKey)!);
  expect(saved.state).toEqual({
    theme: "navy",
    mode: "light",
    page: "gray",
    font: "inter",
    fontScale: scale,
    density: "compact",
    hideSidebar: false,
  });
});

it("remembers hiding the sidebar so the shell can leave the full width to the page", async () => {
  show();
  const panel = await open();
  await userEvent
    .setup()
    .click(panel.getByRole("switch", { name: "Ẩn thanh bên" }));
  expect(usePreferences.getState().hideSidebar).toBe(true);
  expect(
    panel
      .getByRole("switch", { name: "Ẩn thanh bên" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  expect(
    JSON.parse(localStorage.getItem(preferencesKey)!).state.hideSidebar,
  ).toBe(true);
});

it("goes back to the original look when reset", async () => {
  show();
  const panel = await open();
  const user = userEvent.setup();
  await user.click(panel.getByRole("radio", { name: "Than chì" }));
  await user.click(panel.getByRole("radio", { name: "Trắng" }));
  await user.click(panel.getByRole("radio", { name: "Sáng" }));
  await user.selectOptions(
    panel.getByRole("combobox", { name: "Phông chữ" }),
    "Open Sans",
  );
  await user.selectOptions(
    panel.getByRole("combobox", { name: "Cỡ chữ" }),
    "Rất lớn",
  );
  await user.click(panel.getByRole("switch", { name: "Thu gọn thanh bên" }));
  await user.click(panel.getByRole("switch", { name: "Ẩn thanh bên" }));
  expect(useUI.getState().sidebarCollapsed).toBe(true);
  await user.click(panel.getByRole("button", { name: "Về ban đầu" }));
  const root = document.documentElement;
  expect(root.dataset.theme).toBeUndefined();
  expect(root.dataset.mode).toBeUndefined();
  expect(root.dataset.page).toBeUndefined();
  expect(root.dataset.font).toBeUndefined();
  expect(root.dataset.density).toBeUndefined();
  expect(root.style.fontSize).toBe("");
  expect(useUI.getState().sidebarCollapsed).toBe(false);
  expect(usePreferences.getState().hideSidebar).toBe(false);
  expect(checked(panel, "Xanh dương")).toBe("true");
  expect(fontValue(panel)).toBe("be-vietnam");
});

it("switches to dark mode and drops the page color choice that no longer applies", async () => {
  show();
  const panel = await open();
  const user = userEvent.setup();
  await user.click(panel.getByRole("radio", { name: "Tối" }));
  expect(document.documentElement.dataset.mode).toBe("dark");
  expect(checked(panel, "Tối")).toBe("true");
  expect(panel.queryByRole("radiogroup", { name: "Nền trang" })).toBeNull();
  await user.click(panel.getByRole("radio", { name: "Mặc định" }));
  expect(document.documentElement.dataset.mode).toBeUndefined();
  expect(panel.getByRole("radiogroup", { name: "Nền trang" })).toBeTruthy();
});

it("turns every layout option off but keeps colors, mode and fonts", async () => {
  show();
  const panel = await open();
  const user = userEvent.setup();
  await user.click(panel.getByRole("radio", { name: "Xanh navy" }));
  await user.click(panel.getByRole("radio", { name: "Tối" }));
  await user.selectOptions(
    panel.getByRole("combobox", { name: "Cỡ chữ" }),
    "Lớn",
  );
  await user.click(panel.getByRole("switch", { name: "Bảng gọn" }));
  await user.click(panel.getByRole("switch", { name: "Ẩn thanh bên" }));
  await user.click(panel.getByRole("switch", { name: "Thu gọn thanh bên" }));
  expect(useUI.getState().sidebarCollapsed).toBe(true);
  await user.click(panel.getByRole("button", { name: "Tắt hết" }));
  for (const name of ["Thu gọn thanh bên", "Ẩn thanh bên", "Bảng gọn"])
    expect(
      panel.getByRole("switch", { name }).getAttribute("aria-checked"),
    ).toBe("false");
  expect(useUI.getState().sidebarCollapsed).toBe(false);
  const root = document.documentElement;
  expect(root.dataset.density).toBeUndefined();
  expect(root.dataset.theme).toBe("navy");
  expect(root.dataset.mode).toBe("dark");
  expect(root.style.fontSize).toBe("112.5%");
});

it("closes with Escape and returns focus to the settings button", async () => {
  show();
  const trigger = screen.getByRole("button", { name: "Cài đặt giao diện" });
  await open();
  await userEvent.setup().keyboard("{Escape}");
  await act(async () => {});
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
