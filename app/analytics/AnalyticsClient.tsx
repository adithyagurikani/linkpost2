"use client";
import api from "@/lib/api-client";

import { useMemo, useState, useCallback } from 'react';
import { EngagementTrajectory, MetricDensity } from "@/components/EngagementChart";
import { RefreshCw, Database, ArrowRight, TrendingUp, Heart, MessageCircle, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Props {
  stats: any[];
  aggregates: {
    totalLikes: number;
    totalComments: number;
    totalPosts: number;
    hasAnalytics: boolean;
  };
  chartData: any[];
}

export default function AnalyticsClient({ stats: initialStats, aggregates: initialAgg, chartData: initialChart }: Props) {
  const [stats, setStats] = useState(initialStats);
  const [aggregates, setAggregates] = useState(initialAgg);
  const [chartData, setChartData] = useState(initialChart);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.get<any>("/analytics/data");
      setStats(data.stats);
      setAggregates(data.aggregates);
      setChartData(data.chartData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const data = await api.post<any>("/system/sync-analytics");
      setStats(data.stats || stats);
      setAggregates(data.aggregates || aggregates);
      setChartData(data.chartData || chartData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }, [stats, aggregates, chartData]);

  const sortedStats = useMemo(
    () => [...stats].sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)).slice(0, 5),
    [stats]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Refresh header */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Live view"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
          >
            <Database className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Analytics"}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition-all shadow-lg shadow-gray-100"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Empty state when no analytics synced */}
      {!aggregates.hasAnalytics && aggregates.totalPosts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Analytics not yet synced</p>
          <p className="text-amber-600 mb-3">Click <strong>Sync Analytics</strong> above to fetch engagement data from LinkedIn. If Sync returns 0 posts, your LinkedIn app needs the <code className="bg-amber-100 px-1 rounded">w_member_social_feed</code> scope enabled in the <a className="underline font-semibold" href="https://www.linkedin.com/developers/apps" target="_blank">LinkedIn Developer Portal</a>.</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-all"
          >
            <Database className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      )}

      {/* Macro Metric Tickers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reach Multiplier</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{aggregates.totalPosts} <span className="text-sm text-gray-500 font-normal">Posts</span></h3>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600"><Heart className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Appreciation</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{aggregates.totalLikes} <span className="text-sm text-gray-500 font-normal">Likes</span></h3>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"><MessageCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversation Density</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{aggregates.totalComments} <span className="text-sm text-gray-500 font-normal">Comments</span></h3>
          </div>
        </div>
      </div>

      {/* Main Performance Canvas */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#F9FAFB]/50">
          <h3 className="font-semibold text-gray-700">Engagement Trajectory</h3>
          <span className="text-xs text-gray-500 font-medium">Latest {chartData.length} interactions</span>
        </div>
        <div className="p-6 h-[300px] w-full">
          <EngagementTrajectory chartData={chartData} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 bg-[#F9FAFB]/50">
            Top Performing Posts
          </div>
          <div className="flex-1 p-2">
            {stats.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm italic">No engagement data yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sortedStats.map((p: any, idx: number) => (
                  <Link
                    key={p.id}
                    href={`/posts/${p.id}/edit`}
                    className="p-3 hover:bg-gray-50/50 transition-colors flex items-center justify-between rounded-lg group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 max-w-[75%]">
                      <span className="w-6 h-6 flex items-center justify-center rounded bg-gray-50 text-xs font-bold text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-400">{idx+1}</span>
                      <p className="text-sm text-gray-700 truncate font-medium">{p.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2 text-xs font-mono font-semibold bg-[#F9FAFB] px-2 py-1 rounded border border-gray-100">
                        <span className="text-gray-400 flex items-center gap-1"><Heart className="w-3 h-3" /> {p.likes}</span>
                        <span className="text-gray-600 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {p.comments}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Distribution Breakouts */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 bg-[#F9FAFB]/50">
            Metric Density Balance
          </div>
          <div className="p-6 h-[220px]">
            <MetricDensity chartData={chartData} />
          </div>
        </div>
      </div>

    </div>
  );
}
