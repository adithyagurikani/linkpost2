"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart2, CheckCircle2, Clock, XCircle } from "lucide-react";
import api from "@/lib/api-client";

interface Stats {
  total: number;
  posted: number;
  scheduled: number;
  drafts: number;
  failed: number;
}

export default function DashboardStatsLive() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pulse, setPulse] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get<any>("/dashboard/stats");
      setStats({
        total: data.totalPosts || 0,
        posted: data.posted || 0,
        scheduled: data.scheduled || 0,
        drafts: data.drafts || 0,
        failed: data.failed || 0,
      });
    } catch (e) {
      console.error("Failed to fetch dashboard stats:", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  useEffect(() => {
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(id);
  }, [stats]);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-36 sm:h-40 animate-pulse">
            <div className="bg-gray-100 h-8 w-8 rounded-lg" />
            <div>
              <div className="bg-gray-100 h-8 w-16 rounded mb-1" />
              <div className="bg-gray-100 h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Posts", value: stats.total, icon: BarChart2, color: "bg-gray-50 text-gray-600 border-gray-100", badge: "Live", badgeColor: "text-gray-400" },
    { label: "Published", value: stats.posted, icon: CheckCircle2, color: "bg-gray-100 text-gray-900 border-gray-300", badge: "Success", badgeColor: "text-gray-900 bg-gray-100" },
    { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "bg-gray-50 text-gray-600 border-gray-100", badge: "Active", badgeColor: "text-gray-600 bg-gray-50" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "bg-red-50 text-red-600 border-red-100", badge: "Alerts", badgeColor: "text-red-600 bg-red-50" },
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 transition-opacity duration-300 ${pulse ? "opacity-70" : "opacity-100"}`}>
      {cards.map((card) => (
        <div key={card.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-36 sm:h-40">
          <div className="flex items-start justify-between mb-2">
            <div className={`p-2 rounded-lg border ${card.color}`}>
              <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className={`hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${card.badgeColor} px-2 py-0.5 rounded-md`}>
              {card.badge}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter mb-0.5">{card.value}</div>
            <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
