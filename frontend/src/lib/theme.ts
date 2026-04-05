export type ThemePreference = "light" | "dark" | "system";

const APPEARANCE_STORAGE_KEY = "teamforge_appearance_preferences";
const THEME_ATTRIBUTE = "data-theme";

type AppearancePrefs = {
  theme?: ThemePreference;
};

function getSystemTheme(): Exclude<ThemePreference, "system"> {
  return "dark";
}

export function resolveThemePreference(
  preference: ThemePreference | undefined,
): Exclude<ThemePreference, "system"> {
  if (!preference || preference === "system") {
    return getSystemTheme();
  }

  return preference;
}

export function applyThemePreference(preference: ThemePreference | undefined) {
  if (typeof document === "undefined") return;

  const resolvedTheme = resolveThemePreference(preference);
  document.documentElement.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function loadSavedThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as AppearancePrefs;
    const preference = parsed?.theme;

    if (
      preference === "light" ||
      preference === "dark" ||
      preference === "system"
    ) {
      return preference;
    }

    return null;
  } catch {
    return null;
  }
}

export function syncThemeFromStorage() {
  const preference = loadSavedThemePreference() || "dark";
  applyThemePreference(preference);

  return preference;
}
