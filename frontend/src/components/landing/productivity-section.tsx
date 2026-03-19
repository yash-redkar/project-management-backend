export function ProductivitySection() {
  return (
    <section
      id="about"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Built for modern teams
          </p>
          <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Streamline Your Workflow & Boost Team Productivity
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            From planning to execution, TaskForge helps teams stay aligned,
            reduce clutter, and ship faster with a clean productivity-first
            workspace.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-3xl font-semibold text-white">3x</p>
              <p className="mt-2 text-slate-400">
                Faster task tracking and execution visibility
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <p className="text-3xl font-semibold text-white">24/7</p>
              <p className="mt-2 text-slate-400">
                Realtime collaboration across teams and projects
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/30">
          <div className="aspect-4/3 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.22),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6">
            <div className="grid h-full gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Active Discussions</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-slate-800/80 p-3 text-sm text-slate-200">
                    Homepage UI feedback
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 text-sm text-slate-200">
                    Backend auth integration
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 text-sm text-slate-200">
                    Workspace permissions
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Team Progress</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm text-slate-300">
                      <span>Design</span>
                      <span>72%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className="h-full w-[72%] rounded-full bg-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-sm text-slate-300">
                      <span>Development</span>
                      <span>64%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className="h-full w-[64%] rounded-full bg-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-sm text-slate-300">
                      <span>Marketing</span>
                      <span>48%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className="h-full w-[48%] rounded-full bg-violet-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">
                  Why teams choose TaskForge
                </p>
                <p className="mt-3 text-base leading-7 text-slate-200">
                  A focused workspace that combines task management, team
                  collaboration, and project visibility without the clutter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
