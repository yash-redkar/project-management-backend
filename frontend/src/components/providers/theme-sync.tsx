"use client";

import { useEffect } from "react";
import { applyThemePreference, loadSavedThemePreference } from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => {
    const preference = loadSavedThemePreference() || "dark";
    applyThemePreference(preference);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    const handleStorage = () => {
      const nextPreference = loadSavedThemePreference() || "dark";
      applyThemePreference(nextPreference);
    };

    const handleSystemChange = () => {
      const savedPreference = loadSavedThemePreference() || "dark";
      if (savedPreference === "system") {
        applyThemePreference("system");
      }
    };

    window.addEventListener("storage", handleStorage);
    mediaQuery.addEventListener?.("change", handleSystemChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      mediaQuery.removeEventListener?.("change", handleSystemChange);
    };
  }, []);

  return null;
}
