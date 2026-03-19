export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden border-r border-white/10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.18),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-cyan-400 text-lg font-bold text-white">
                T
              </div>
              <div>
                <p className="text-xl font-semibold tracking-tight text-white">
                  TaskForge
                </p>
                <p className="text-sm text-slate-400">Project command center</p>
              </div>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Welcome back
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
              Focus your team. Track work. Deliver faster.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Log in to continue managing projects, tasks, notifications, and
              collaboration from one focused workspace.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <p className="text-sm text-slate-400">Why teams choose TaskForge</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-white">24/7</p>
                <p className="mt-1 text-sm text-slate-400">
                  Realtime visibility
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">3x</p>
                <p className="mt-1 text-sm text-slate-400">
                  Better execution flow
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">1 hub</p>
                <p className="mt-1 text-sm text-slate-400">For all team work</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {title}
              </h1>
              <p className="mt-2 text-slate-400">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
