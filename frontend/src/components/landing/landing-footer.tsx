import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="mt-12 border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-medium text-slate-300">TaskForge</p>
          <p className="mt-1">Modern project management for focused teams.</p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/login" className="transition hover:text-white">
            Login
          </Link>
          <Link href="/register" className="transition hover:text-white">
            Sign Up
          </Link>
        </div>
      </div>
    </footer>
  );
}
