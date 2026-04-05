"use client";

import { X } from "lucide-react";
import { AppSidebar } from "./app-sidebar";

export function MobileSidebarDrawer({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[88vw] max-w-xs transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-200"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        <AppSidebar className="flex w-full" onNavigate={onClose} user={user} />
      </div>
    </>
  );
}
