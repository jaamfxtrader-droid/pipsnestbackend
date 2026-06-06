"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { performanceSeries } from "@/lib/mock-data";

export function ChartCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-5">
        <h3 className="font-semibold">Equity Curve</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">MT5-ready statistics for the current challenge.</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceSeries}>
            <defs>
              <linearGradient id="equity" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis dataKey="day" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
            <Area type="monotone" dataKey="equity" stroke="#22C55E" fillOpacity={1} fill="url(#equity)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
