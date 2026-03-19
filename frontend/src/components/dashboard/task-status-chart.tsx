"use client";

import { div } from "framer-motion/m";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type StatusItem = {
  name: string;
  value: number;
};

const COLORS = [
  "#64748b", // todo
  "#22d3ee", // in progress
  "#34d399", // done
];

export default function TaskStatusChart({ data }: { data: StatusItem[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              color: "white",
            }}
            labelStyle={{ color: "#cbd5e1" }}
          />

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={68}
            outerRadius={96}
            paddingAngle={4}
            stroke="rgba(15,23,42,0.8)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white text-2xl font-semibold"
          >
            {total}
          </text>
          <text
            x="50%"
            y="57%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-500 text-xs"
          >
            Tasks
          </text>
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
