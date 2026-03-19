import Link from "next/link";
import { FadeUp } from "@/components/ui/fade-up";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_left_bottom,rgba(168,85,247,0.14),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeUp delay={0.1}>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Manage Projects, Tasks & Teams in One Powerful Workspace
            </h1>
          </FadeUp>

          <FadeUp delay={0.25}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Organize your work, collaborate in real time, and deliver projects
              faster with a modern workspace built for focused teams.
            </p>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-2xl bg-linear-to-r from-cyan-400 to-indigo-500 px-8 py-3 text-base font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
              >
                Get Started Free
              </Link>

              <a
                href="#product"
                className="rounded-2xl border border-slate-600 px-8 py-3 text-base font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900/70"
              >
                Book a Demo
              </a>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
