"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    try {
      setIsLoading(true);

      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: "include",
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok) {
        localStorage.setItem("accessToken", data.data.accessToken);
        toast.success("Login successful");
        const nextUrl = searchParams.get("next") || "/dashboard";
        window.location.href = nextUrl;
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong while logging in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Log in to TaskForge"
      subtitle="Enter your credentials to continue to your workspace."
    >
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <AuthInput
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthInput
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              className="rounded border-slate-700 bg-slate-900"
            />
            Remember me
          </label>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-zinc-950 px-3 text-xs uppercase tracking-[0.2em] text-slate-500">
              or
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-cyan-300 hover:text-cyan-200"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
