"use client";

export default function StatsCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}
