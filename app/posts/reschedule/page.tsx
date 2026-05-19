"use client";
import api from "@/lib/api-client";
import { detectTimezone } from "@/lib/schedule-utils";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageContainer from "@/components/PageContainer";
import { useToast } from "@/components/Toast";

export default function ReschedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [overdueCount, setOverdueCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [times, setTimes] = useState<string[]>(["09:00", "13:00", "17:00"]);
  const [postsPerDay, setPostsPerDay] = useState(3);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{
    rescheduled: number;
    daysScheduled: number;
    startDate: string;
  } | null>(null);

  useEffect(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    setStartDate(tomorrow.toISOString().slice(0, 10));
    api
      .get<{ total: number }>("/posts", {
        status: "scheduled,queued,draft",
        page: 1,
        limit: 1,
      })
      .then((data) => setOverdueCount(data.total))
      .catch(() => setOverdueCount(0))
      .finally(() => setLoading(false));
  }, []);

  const addTime = () => setTimes((p) => [...p, "12:00"]);
  const removeTime = (i: number) => setTimes((p) => p.filter((_, idx) => idx !== i));
  const updateTime = (i: number, v: string) =>
    setTimes((p) => p.map((t, idx) => (idx === i ? v : t)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExecuting(true);
    setResult(null);
    try {
      const data = await api.post<any>("/posts/reschedule", {
        startDate,
        times,
        postsPerDay,
        timezone: detectTimezone(),
      });
      setResult(data);
      toast(`Rescheduled ${data.rescheduled} posts across ${data.daysScheduled} days`, "success");
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Failed to reschedule", "error");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <ProtectedRoute>
      <PageContainer
        title="Reschedule Posts"
        description="Redistribute overdue scheduled posts across upcoming days"
        breadcrumbs={[
          { label: "Posts", href: "/posts" },
          { label: "Reschedule" },
        ]}
      >
        <div className="max-w-2xl">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4 sm:p-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {result && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                    <div className="font-bold text-emerald-800 text-sm">
                      Rescheduled {result.rescheduled} posts
                    </div>
                    <div className="text-emerald-600 text-xs mt-1">
                      Spread across {result.daysScheduled} days starting {result.startDate}
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                  <div className="font-bold text-amber-800 text-sm">
                    {overdueCount} posts available to reschedule
                  </div>
                  <div className="text-amber-600 text-xs mt-1">
                    Overdue, unscheduled drafts, and queued posts will be redistributed starting from the date below.
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Posting Times
                    </label>
                    <button
                      type="button"
                      onClick={addTime}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors"
                    >
                      + Add Time
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {times.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={t}
                          onChange={(e) => updateTime(i, e.target.value)}
                          required
                          className="flex-1 bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        />
                        {times.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTime(i)}
                            className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                    Posts Per Day
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPostsPerDay(n)}
                        className={`py-3 rounded-2xl text-xs font-black transition-all ${postsPerDay === n ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={executing || !startDate}
                  className="w-full bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100"
                >
                  {executing
                    ? "Rescheduling..."
                    : result
                      ? "Reschedule Again"
                      : "Reschedule All Posts"}
                </button>
              </form>
            )}
          </div>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
