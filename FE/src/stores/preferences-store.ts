"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Tùy chọn giao diện của riêng trình duyệt này (không phải dữ liệu nghiệp vụ nên
// không qua API): màu chủ đạo, nền trang, cỡ chữ, mật độ bảng và ẩn thanh bên.
// `color` là màu thanh điều hướng, `accent` là màu nút và liên kết của bộ đó.
export const themes = [
  { value: "ocean", label: "Xanh dương", color: "#1177aa", accent: "#096e9d" },
  { value: "navy", label: "Xanh navy", color: "#1e3a5f", accent: "#1d5ea8" },
  { value: "teal", label: "Xanh ngọc", color: "#0f766e", accent: "#0f766e" },
  { value: "indigo", label: "Chàm", color: "#4351a8", accent: "#4351a8" },
  { value: "slate", label: "Than chì", color: "#38485c", accent: "#3f5470" },
] as const;
export const pages = [
  { value: "blue", label: "Xanh nhạt", color: "#f3f7fa" },
  { value: "gray", label: "Xám", color: "#f2f3f5" },
  { value: "white", label: "Trắng", color: "#ffffff" },
  { value: "sand", label: "Be nhạt", color: "#f6f4f0" },
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
export type PageColor = (typeof pages)[number]["value"];
export type FontScale = (typeof fontScales)[number]["value"];
export type Density = (typeof densities)[number]["value"];

export const defaultPreferences = {
  theme: "ocean" as Theme,
  page: "blue" as PageColor,
  fontScale: "base" as FontScale,
  density: "comfortable" as Density,
  hideSidebar: false,
};
type Preferences = typeof defaultPreferences;

export const preferencesKey = "datn.preferences";

type PreferencesState = Preferences & {
  set: (patch: Partial<Preferences>) => void;
  reset: () => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      set: (patch) => set(patch),
      reset: () => set(defaultPreferences),
    }),
    {
      name: preferencesKey,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ theme, page, fontScale, density, hideSidebar }) => ({
        theme,
        page,
        fontScale,
        density,
        hideSidebar,
      }),
    },
  ),
);

// Đặt thuộc tính lên <html>: màu chủ đạo, nền trang và mật độ qua data-*, cỡ chữ qua
// font-size gốc (mọi cỡ chữ và khoảng cách tính theo rem nên tự co giãn theo). Giá trị
// mặc định gỡ thuộc tính để quay về CSS gốc. Ẩn thanh bên do AppShell đọc từ store.
export function applyPreferences(
  root: HTMLElement,
  { theme, page, fontScale, density }: Preferences,
) {
  const set = (name: string, value: string, fallback: string) => {
    if (value === fallback) delete root.dataset[name];
    else root.dataset[name] = value;
  };
  set("theme", theme, defaultPreferences.theme);
  set("page", page, defaultPreferences.page);
  set("density", density, defaultPreferences.density);
  const size = fontScales.find((item) => item.value === fontScale)?.size;
  if (size && fontScale !== defaultPreferences.fontScale)
    root.style.fontSize = size;
  else root.style.removeProperty("font-size");
}

// Chạy trước khi vẽ để không nháy màu mặc định rồi mới đổi; cùng giá trị với
// applyPreferences, đọc thẳng từ localStorage. Lỗi đọc (chế độ riêng tư) thì bỏ qua.
export const preferencesBootScript = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(preferencesKey)})||"{}").state||{};var r=document.documentElement;var m={large:"112.5%",xlarge:"125%"};if(s.theme&&s.theme!=="ocean")r.dataset.theme=s.theme;if(s.page&&s.page!=="blue")r.dataset.page=s.page;if(s.density==="compact")r.dataset.density="compact";if(m[s.fontScale])r.style.fontSize=m[s.fontScale]}catch(e){}`;
