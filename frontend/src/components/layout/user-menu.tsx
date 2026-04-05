"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User as UserIcon, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import toast from "react-hot-toast";

function getInitials(user: any) {
  const name =
    user?.fullname || user?.fullName || user?.username || user?.email || "U";

  const parts = String(name).trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return String(name).slice(0, 2).toUpperCase();
}

const menuItemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-900 hover:text-white";

export function UserMenu({ user }: { user: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const displayName =
    user?.fullname || user?.fullName || user?.username || "User";
  const email = user?.email || "No email";
  const initials = getInitials(user);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      await authService.logout();

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }

      toast.success("Logged out successfully");

      setOpen(false);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Failed to logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-[var(--app-surface)] shadow-2xl">
          <div className="border-b border-slate-800 px-4 py-4">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="mt-1 truncate text-xs text-slate-400">{email}</p>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={() => handleNavigate("/settings?tab=profile")}
              className={menuItemClass}
            >
              <UserIcon className="size-4 text-slate-400" />
              Profile
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("/settings")}
              className={menuItemClass}
            >
              <Settings className="size-4 text-slate-400" />
              Settings
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("/settings?tab=team")}
              className={menuItemClass}
            >
              <Users className="size-4 text-slate-400" />
              Team
            </button>
          </div>

          <div className="border-t border-slate-800 p-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
            >
              <LogOut className="size-4" />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
