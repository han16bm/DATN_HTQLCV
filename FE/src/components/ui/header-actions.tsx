"use client";
import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const HeaderTarget = createContext<HTMLDivElement | null>(null);

// Trang con giữ logic thao tác; shell chỉ cung cấp vị trí trên header.
export function HeaderActions({ children }: { children: ReactNode }) {
  const target = useContext(HeaderTarget);
  return target ? createPortal(children, target) : children;
}
