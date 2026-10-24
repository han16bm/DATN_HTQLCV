"use client";
import { create } from "zustand";
type UIState = {
  sidebarOpen: boolean;
  dirtyForms: string[];
  setSidebar: (open: boolean) => void;
  markDirty: (id: string, dirty: boolean) => void;
  reset: () => void;
};
export const useUI = create<UIState>((set) => ({
  sidebarOpen: false,
  dirtyForms: [],
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  markDirty: (id, dirty) =>
    set((s) => ({
      dirtyForms: dirty
        ? [...new Set([...s.dirtyForms, id])]
        : s.dirtyForms.filter((v) => v !== id),
    })),
  reset: () => set({ sidebarOpen: false, dirtyForms: [] }),
}));
