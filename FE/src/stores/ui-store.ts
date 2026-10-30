"use client";
import { listRoute } from "@/lib/navigation";
import { create } from "zustand";

type UIState = {
  confirmation: { message: string; resolve: (value: boolean) => void } | null;
  confirm: (message: string) => Promise<boolean>;
  answer: (value: boolean) => void;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  dirtyForms: string[];
  // Ngữ cảnh điều hướng: tên thực thể cho breadcrumb, URL danh sách gần nhất
  // (giữ bộ lọc/phân trang) và trang trước trong ứng dụng.
  labels: Record<string, { label: string; parentId?: string }>;
  // Dự án/công việc vừa mở, mới nhất trước, cho mục Gần đây ở sidebar.
  recent: string[];
  listUrls: Record<string, string>;
  currentUrl: string | null;
  previousUrl: string | null;
  setSidebar: (open: boolean) => void;
  toggleSidebar: () => void;
  markDirty: (id: string, dirty: boolean) => void;
  clearDirty: () => void;
  setLabel: (key: string, label: string, parentId?: string) => void;
  clearLabels: () => void;
  visit: (url: string) => void;
  reset: () => void;
};
const navigationState = {
  labels: {},
  recent: [] as string[],
  listUrls: {},
  currentUrl: null,
  previousUrl: null,
};
export const useUI = create<UIState>((set, get) => ({
  confirmation: null,
  confirm: (message) => {
    get().confirmation?.resolve(false);
    return new Promise((resolve) =>
      set({ confirmation: { message, resolve } }),
    );
  },
  answer: (value) => {
    const pending = get().confirmation;
    set({ confirmation: null });
    pending?.resolve(value);
  },
  sidebarOpen: false,
  sidebarCollapsed: false,
  dirtyForms: [],
  ...navigationState,
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  markDirty: (id, dirty) =>
    set((s) => ({
      dirtyForms: dirty
        ? [...new Set([...s.dirtyForms, id])]
        : s.dirtyForms.filter((v) => v !== id),
    })),
  clearDirty: () => set({ dirtyForms: [] }),
  setLabel: (key, label, parentId) =>
    set((s) => {
      const current = s.labels[key];
      const recent = /^(?:project|task):/.test(key)
        ? [key, ...s.recent.filter((value) => value !== key)].slice(0, 8)
        : s.recent;
      return current?.label === label &&
        current.parentId === parentId &&
        recent[0] === s.recent[0]
        ? s
        : { labels: { ...s.labels, [key]: { label, parentId } }, recent };
    }),
  clearLabels: () => set({ labels: {}, recent: [] }),
  visit: (url) =>
    set((s) => {
      if (url === s.currentUrl) return s;
      const path = url.split("?")[0];
      return {
        previousUrl: s.currentUrl,
        currentUrl: url,
        listUrls: listRoute(path) ? { ...s.listUrls, [path]: url } : s.listUrls,
      };
    }),
  reset: () => {
    get().confirmation?.resolve(false);
    set({
      sidebarOpen: false,
      sidebarCollapsed: false,
      dirtyForms: [],
      confirmation: null,
      ...navigationState,
    });
  },
}));
