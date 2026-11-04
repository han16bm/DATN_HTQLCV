"use client";
import { applyPreferences, usePreferences } from "@/stores/preferences-store";
import { useEffect } from "react";

// Giữ <html> khớp với tùy chọn giao diện: áp khi nạp và mỗi lần người dùng đổi.
// Đặt ở Providers để trang đăng nhập cũng nhận cùng màu và cỡ chữ.
export function PreferencesSync() {
  const theme = usePreferences((s) => s.theme);
  const page = usePreferences((s) => s.page);
  const fontScale = usePreferences((s) => s.fontScale);
  const density = usePreferences((s) => s.density);
  const hideSidebar = usePreferences((s) => s.hideSidebar);
  useEffect(() => {
    applyPreferences(document.documentElement, {
      theme,
      page,
      fontScale,
      density,
      hideSidebar,
    });
  }, [theme, page, fontScale, density, hideSidebar]);
  return null;
}
