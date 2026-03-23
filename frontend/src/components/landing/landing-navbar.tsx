import Link from "next/link";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-cyan-400 text-lg font-bold text-white shadow-lg">
            T
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-white">
              TeamForge
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Features
          </a>
          <a
            href="#product"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Product
          </a>
          <a
            href="#about"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            About
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-linear-to-r from-cyan-400 to-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
