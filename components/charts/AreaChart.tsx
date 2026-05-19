"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AreaChartWrapper({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-2 border-2 border-dashed rounded-lg bg-[#F9FAFB]">
        <span className="text-3xl">📊</span>
        <p>No engagement data yet.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} />
        <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: '10px', fontWeight: 'bold' }} />
        <Area type="monotone" dataKey="likes" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLikes)" />
        <Area type="monotone" dataKey="comments" stroke="#8b5cf6" strokeWidth={3} fillOpacity={0} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
