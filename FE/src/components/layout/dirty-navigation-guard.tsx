"use client";
import { useUI } from "@/stores/ui-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function DirtyNavigationGuard() {
  const path = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const previous = useRef<{ url: string; state: unknown } | null>(null);
  useEffect(() => {
    previous.current = { url: location.href, state: history.state };
  }, [path, search]);
  useEffect(() => {
    const remember = () => {
      previous.current = { url: location.href, state: history.state };
    };
    const discard = async () => {
      if (
        !(await useUI
          .getState()
          .confirm("Bạn có dữ liệu chưa lưu. Bỏ thay đổi để rời trang?"))
      )
        return false;
      useUI.getState().clearDirty();
      useUI.getState().setSidebar(false);
      return true;
    };
    const back = async (event: PopStateEvent) => {
      if (previous.current && useUI.getState().dirtyForms.length) {
        event.stopImmediatePropagation();
        const target = new URL(location.href);
        history.pushState(previous.current.state, "", previous.current.url);
        if (await discard())
          router.replace(target.pathname + target.search + target.hash);
      } else remember();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (useUI.getState().dirtyForms.length) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigate = async (event: MouseEvent) => {
      if (
        !useUI.getState().dirtyForms.length ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const target = new URL(anchor.href, location.href);
      if (
        target.pathname === location.pathname &&
        target.search === location.search
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (await discard()) {
        if (target.origin === location.origin)
          router.push(target.pathname + target.search + target.hash);
        else location.assign(target.href);
      }
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
  }, [router]);
  return null;
}
