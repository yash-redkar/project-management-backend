"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function WeeklyChart({ data }: { data: any[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 12, left: 12, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.75} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            padding={{ left: 16, right: 16 }}
          />

          <YAxis hide />

          <Tooltip
            cursor={{ stroke: "rgba(34,211,238,0.25)", strokeWidth: 1 }}
            contentStyle={{
              background: "#020617",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              color: "white",
            }}
            labelStyle={{ color: "#cbd5e1" }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="#22d3ee"
            strokeWidth={3}
            fill="url(#colorActivity)"
            dot={false}
            activeDot={{
              r: 5,
              stroke: "#22d3ee",
              strokeWidth: 2,
              fill: "#0f172a",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
