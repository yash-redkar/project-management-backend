"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type AuthInputProps = {
  label: string;
  type?: string;
  placeholder?: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function AuthInput({
  label,
  type = "text",
  placeholder,
  name,
  value,
  onChange,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === "password";
  const inputType = isPasswordField
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-[var(--app-text)]"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-12 w-full rounded-2xl border px-4 pr-12 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          style={{
            borderColor:
              "color-mix(in srgb, var(--app-muted) 28%, transparent)",
            backgroundColor:
              "color-mix(in srgb, var(--app-surface) 90%, rgb(56 189 248) 10%)",
          }}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
