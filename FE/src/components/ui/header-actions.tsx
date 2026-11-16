"use client";
import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const HeaderTarget = createContext<HTMLDivElement | null>(null);

export function HeaderActions({ children }: { children: ReactNode }) {
  const target = useContext(HeaderTarget);
  return target ? createPortal(children, target) : children;
}
