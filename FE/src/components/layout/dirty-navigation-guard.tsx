"use client";
import { useUI } from "@/stores/ui-store";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function DirtyNavigationGuard() {
  const path = usePathname();
  const search = useSearchParams();
  const previous = useRef<{ url: string; state: unknown } | null>(null);
  useEffect(() => {
    previous.current = { url: location.href, state: history.state };
  }, [path, search]);
  useEffect(() => {
    const remember = () => {
      previous.current = { url: location.href, state: history.state };
    };
    const back = (event: PopStateEvent) => {
      if (
        previous.current &&
        useUI.getState().dirtyForms.length &&
        !window.confirm(
          "Bạn có dữ liệu chưa lưu. Bỏ thay đổi để rời nội dung này?",
        )
      ) {
        event.stopImmediatePropagation();
        history.pushState(previous.current.state, "", previous.current.url);
        return;
      }
      if (useUI.getState().dirtyForms.length) useUI.getState().reset();
      remember();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (useUI.getState().dirtyForms.length) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigate = (event: MouseEvent) => {
      if (!useUI.getState().dirtyForms.length || event.defaultPrevented) return;
      const anchor =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const destination = new URL(anchor.href, location.href);
      if (
        destination.pathname === location.pathname &&
        destination.search === location.search
      )
        return;
      if (
        !window.confirm("Bạn có dữ liệu chưa lưu. Bỏ thay đổi để rời trang?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      } else useUI.getState().reset();
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("hashchange", remember);
    window.addEventListener("popstate", back, true);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("hashchange", remember);
      window.removeEventListener("popstate", back, true);
      document.removeEventListener("click", navigate, true);
    };
  }, []);
  return null;
}
