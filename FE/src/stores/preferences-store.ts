"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Tùy chọn giao diện của riêng trình duyệt này (không phải dữ liệu nghiệp vụ nên
// không qua API): màu chủ đạo, chế độ sáng/tối, nền trang, phông chữ, cỡ chữ, mật độ
// bảng và ẩn thanh bên. Màu của từng bộ chủ đạo chỉ khai ở tokens.css ([data-theme]).
export const themes = [
  { value: "ocean", label: "Xanh dương" },
  { value: "navy", label: "Xanh navy" },
  { value: "teal", label: "Xanh ngọc" },
  { value: "indigo", label: "Chàm" },
  { value: "slate", label: "Than chì" },
  { value: "purple", label: "Tím" },
  { value: "orchid", label: "Tím hồng" },
  { value: "pink", label: "Hồng" },
  { value: "crimson", label: "Đỏ" },
  { value: "orange", label: "Cam" },
  { value: "amber", label: "Vàng đậm" },
  { value: "olive", label: "Xanh rêu" },
  { value: "green", label: "Xanh lá" },
  { value: "cyan", label: "Xanh lơ" },
  { value: "brown", label: "Nâu" },
] as const;
// Mặc định: thanh điều hướng màu, nền sáng. Sáng: thanh điều hướng trắng. Tối: toàn bộ
// nền, bề mặt và chữ đổi sang tối (luật [data-mode] ở tokens.css).
export const modes = [
  { value: "default", label: "Mặc định" },
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
] as const;
export const pages = [
  { value: "blue", label: "Xanh nhạt", color: "#f6f9fb" },
  { value: "gray", label: "Xám", color: "#f2f3f5" },
  { value: "white", label: "Trắng", color: "#ffffff" },
  { value: "sand", label: "Be nhạt", color: "#f6f4f0" },
] as const;
// Phông chữ đều có bộ ký tự tiếng Việt đầy đủ; giá trị khớp tên biến --font-<giá trị>
// khai báo ở app/layout.tsx và các luật :root[data-font] ở tokens.css.
export const fonts = [
  { value: "be-vietnam", label: "Be Vietnam Pro" },
  { value: "inter", label: "Inter" },
  { value: "noto", label: "Noto Sans" },
  { value: "roboto", label: "Roboto" },
  { value: "source", label: "Source Sans 3" },
  { value: "open-sans", label: "Open Sans" },
] as const;
export const fontScales = [
  { value: "base", label: "Vừa", size: "100%" },
  { value: "large", label: "Lớn", size: "112.5%" },
  { value: "xlarge", label: "Rất lớn", size: "125%" },
] as const;
export const densities = [
  { value: "comfortable", label: "Thoáng" },
  { value: "compact", label: "Gọn" },
] as const;

export type Theme = (typeof themes)[number]["value"];
export type Mode = (typeof modes)[number]["value"];
export type PageColor = (typeof pages)[number]["value"];
export type FontFamily = (typeof fonts)[number]["value"];
export type FontScale = (typeof fontScales)[number]["value"];
export type Density = (typeof densities)[number]["value"];

export const defaultPreferences = {
  theme: "ocean" as Theme,
  mode: "default" as Mode,
  page: "blue" as PageColor,
  font: "be-vietnam" as FontFamily,
  fontScale: "base" as FontScale,
  density: "comfortable" as Density,
  hideSidebar: false,
};
type Preferences = typeof defaultPreferences;

export const preferencesKey = "datn.preferences";

type PreferencesState = Preferences & {
  set: (patch: Partial<Preferences>) => void;
  // Tắt hết: chỉ các tùy chọn bố cục (bảng gọn, ẩn thanh bên), giữ màu, chế độ, chữ.
  resetLayout: () => void;
  // Về ban đầu: mọi tùy chọn giao diện.
  reset: () => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      set: (patch) => set(patch),
      resetLayout: () =>
        set({
          density: defaultPreferences.density,
          hideSidebar: defaultPreferences.hideSidebar,
        }),
      reset: () => set(defaultPreferences),
    }),
    {
      name: preferencesKey,
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        theme,
        mode,
        page,
        font,
        fontScale,
        density,
        hideSidebar,
      }) => ({
        theme,
        mode,
        page,
        font,
        fontScale,
        density,
        hideSidebar,
      }),
    },
  ),
);

// Đặt thuộc tính lên <html>: màu chủ đạo, chế độ, nền trang, phông chữ và mật độ qua data-*, cỡ chữ qua
// font-size gốc (mọi cỡ chữ và khoảng cách tính theo rem nên tự co giãn theo). Giá trị
// mặc định gỡ thuộc tính để quay về CSS gốc. Ẩn thanh bên do AppShell đọc từ store.
export function applyPreferences(
  root: HTMLElement,
  { theme, mode, page, font, fontScale, density }: Preferences,
) {
  const set = (name: string, value: string, fallback: string) => {
    if (value === fallback) delete root.dataset[name];
    else root.dataset[name] = value;
  };
  set("theme", theme, defaultPreferences.theme);
  set("mode", mode, defaultPreferences.mode);
  set("page", page, defaultPreferences.page);
  set("font", font, defaultPreferences.font);
  set("density", density, defaultPreferences.density);
  const size = fontScales.find((item) => item.value === fontScale)?.size;
  if (size && fontScale !== defaultPreferences.fontScale)
    root.style.fontSize = size;
  else root.style.removeProperty("font-size");
}

// Chạy trước khi vẽ để không nháy màu mặc định rồi mới đổi; cùng giá trị với
// applyPreferences, đọc thẳng từ localStorage. Lỗi đọc (chế độ riêng tư) thì bỏ qua.
export const preferencesBootScript = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(preferencesKey)})||"{}").state||{};var r=document.documentElement;var m={large:"112.5%",xlarge:"125%"};if(s.theme&&s.theme!=="ocean")r.dataset.theme=s.theme;if(s.mode==="light"||s.mode==="dark")r.dataset.mode=s.mode;if(s.page&&s.page!=="blue")r.dataset.page=s.page;if(s.font&&s.font!=="be-vietnam")r.dataset.font=s.font;if(s.density==="compact")r.dataset.density="compact";if(m[s.fontScale])r.style.fontSize=m[s.fontScale]}catch(e){}`;
