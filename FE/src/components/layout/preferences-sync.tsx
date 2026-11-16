"use client";
import { applyPreferences, usePreferences } from "@/stores/preferences-store";
import { useEffect } from "react";

export function PreferencesSync() {
  const theme = usePreferences((s) => s.theme);
  const mode = usePreferences((s) => s.mode);
  const page = usePreferences((s) => s.page);
  const font = usePreferences((s) => s.font);
  const fontScale = usePreferences((s) => s.fontScale);
  const density = usePreferences((s) => s.density);
  const hideSidebar = usePreferences((s) => s.hideSidebar);
  useEffect(() => {
    applyPreferences(document.documentElement, {
      theme,
      mode,
      page,
      font,
      fontScale,
      density,
      hideSidebar,
    });
  }, [theme, mode, page, font, fontScale, density, hideSidebar]);
  return null;
}
