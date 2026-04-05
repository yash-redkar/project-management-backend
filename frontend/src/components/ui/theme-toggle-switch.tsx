"use client";

type ThemeToggleSwitchProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function ThemeToggleSwitch({
  checked,
  onChange,
}: ThemeToggleSwitchProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="relative h-7 w-12 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
      style={{
        backgroundColor: checked ? "var(--toggle-on)" : "var(--toggle-off)",
        boxShadow: checked
          ? "0 0 0 1px color-mix(in srgb, var(--toggle-on) 35%, transparent)"
          : "0 0 0 1px rgba(71, 85, 105, 0.35)",
      }}
    >
      <span
        className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform duration-200"
        style={{
          transform: checked ? "translateX(20px)" : "translateX(0)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
        }}
      />
    </button>
  );
}
