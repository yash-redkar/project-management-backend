export function FeaturesSection() {
  const features = [
    {
      title: "Flexible Kanban Boards",
      description:
        "Visualize work clearly with boards, statuses, and progress tracking.",
    },
    {
      title: "Real-Time Collaboration",
      description:
        "Discuss tasks instantly with chat, comments, and live team updates.",
    },
    {
      title: "Smart Notifications",
      description:
        "Stay on top of mentions, assignments, and important activity signals.",
    },
  ];

  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:shadow-[0_0_40px_rgba(34,211,238,0.08)]"
          >
            <div className="mb-4 h-12 w-12 rounded-2xl bg-linear-to-br from-cyan-400 to-indigo-500" />
            <h3 className="text-xl font-semibold text-white">
              {feature.title}
            </h3>
            <p className="mt-3 text-slate-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
