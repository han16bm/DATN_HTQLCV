"use client";
import { create } from "zustand";

type UIState = {
  confirmation: { message: string; resolve: (value: boolean) => void } | null;
  confirm: (message: string) => Promise<boolean>;
  answer: (value: boolean) => void;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  dirtyForms: string[];
  setSidebar: (open: boolean) => void;
  toggleSidebar: () => void;
  markDirty: (id: string, dirty: boolean) => void;
  clearDirty: () => void;
  reset: () => void;
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
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  markDirty: (id, dirty) =>
    set((s) => ({
      dirtyForms: dirty
        ? [...new Set([...s.dirtyForms, id])]
        : s.dirtyForms.filter((v) => v !== id),
    })),
  clearDirty: () => set({ dirtyForms: [] }),
  reset: () => {
    get().confirmation?.resolve(false);
    set({
      sidebarOpen: false,
      sidebarCollapsed: false,
      dirtyForms: [],
      confirmation: null,
    });
  },
}));
