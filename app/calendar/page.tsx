"use client";

import { useEffect, useState, Suspense } from "react";
import api from "@/lib/api-client";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import { Loader2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSearchParams } from "next/navigation";

function CalendarContent() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1)) - 1;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        
        const { posts: fetchedPosts } = await api.get<any>("/posts", {
          startDate,
          endDate,
          limit: 500,
        });
        
        setPosts(fetchedPosts.map((p: any) => ({
          ...p,
          scheduledAt: p.scheduledAt ? new Date(p.scheduledAt) : null,
        })));
      } catch (err) {
        console.error("Failed to fetch calendar posts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, month]);

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayIndex = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const gridItems: (number | null)[] = [];
  for (let i = 0; i < startDayIndex; i++) gridItems.push(null);
  for (let day = 1; day <= daysInMonth; day++) gridItems.push(day);

  const monthName = firstDayOfMonth.toLocaleString("default", { month: "long" });
  const prevMonth = month === 0 ? 12 : month;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 1 : month + 2;
  const nextYear = month === 11 ? year + 1 : year;

  const headerActions = (
    <div className="flex items-center gap-3">
      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
        <Link
          href={`/calendar?month=${prevMonth}&year=${prevYear}`}
          className="p-1.5 hover:bg-white/10 rounded text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <Link
          href={`/calendar?month=${nextMonth}&year=${nextYear}`}
          className="p-1.5 hover:bg-white/10 rounded text-gray-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <Link
        href="/calendar"
        className="hidden sm:block text-xs font-bold bg-white/5 border border-white/10 text-gray-300 hover:bg-white hover:text-black px-3 py-2 rounded-lg transition-colors"
      >
        Today
      </Link>
      
      <Link
        href="/posts/new"
        className="bg-gray-600 text-white hover:bg-gray-700 font-bold text-sm px-4 py-2 rounded-lg shadow-lg shadow-gray-500/20 transition-all text-center flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Post
      </Link>
    </div>
  );

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <PageContainer
      title={`${monthName} ${year}`}
      description="View your scheduled and published posts organized by month."
      breadcrumbs={[{ label: "Calendar" }]}
      actions={headerActions}
    >
      <div className="space-y-6">
        <div className="hidden sm:block">
          <CalendarGrid gridItems={gridItems} posts={posts} today={now} viewYear={year} viewMonth={month} />
        </div>

        <div className="sm:hidden">
          <MobileCalendarList posts={posts} today={now} daysInMonth={daysInMonth} viewYear={year} viewMonth={month} />
        </div>
      </div>
    </PageContainer>
  );
}

function CalendarGrid({
  gridItems,
  posts,
  today,
  viewYear,
  viewMonth,
}: {
  gridItems: (number | null)[];
  posts: any[];
  today: Date;
  viewYear: number;
  viewMonth: number;
}) {
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 text-center font-bold text-xs text-gray-500 uppercase tracking-widest">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-4 border-r last:border-r-0 border-gray-200/60">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-gray-200/60 border-l border-t border-transparent">
        {gridItems.map((day, index) => {
          if (day === null)
            return <div key={`empty-${index}`} className="bg-gray-50/50 min-h-[110px] lg:min-h-[130px]" />;

          const isToday = isCurrentMonth && day === today.getDate();
          const todaysPosts = posts.filter((p) => p.scheduledAt && p.scheduledAt.getDate() === day);

          return (
            <div
              key={`day-${day}`}
              className={`min-h-[110px] lg:min-h-[130px] p-2 transition-colors flex flex-col ${isToday ? "bg-gray-50/20" : "bg-white hover:bg-gray-50/30"}`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div
                  className={`text-xs lg:text-sm font-bold flex items-center justify-center h-6 w-6 rounded-full ${isToday ? "bg-gray-600 text-white shadow-md" : "text-gray-900"}`}
                >
                  {day}
                </div>
                {todaysPosts.length > 0 && <span className="text-[9px] font-black text-gray-400 uppercase">{todaysPosts.length} Total</span>}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
                {todaysPosts.map((post) => {
                  const statusColors: Record<string, string> = {
                    posted: "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200",
                    scheduled: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
                    queued: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
                    failed: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
                  };
                  const cls = statusColors[post.status] || "bg-gray-50 text-gray-600 border-gray-200";
                  return (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}/edit`}
                      className={`block text-[10px] px-2 py-1 rounded-lg border shadow-sm truncate font-bold transition-all cursor-pointer ${cls}`}
                      title={post.content}
                    >
                      <span className="opacity-70">{post.scheduledAt?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> &bull; {post.accountName || "General"}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileCalendarList({
  posts,
  today,
  daysInMonth,
  viewYear,
  viewMonth,
}: {
  posts: any[];
  today: Date;
  daysInMonth: number;
  viewYear: number;
  viewMonth: number;
}) {
  const grouped: Record<number, typeof posts> = {};
  for (const post of posts) {
    if (!post.scheduledAt) continue;
    const day = post.scheduledAt.getDate();
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(post);
  }

  const days = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  if (days.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-xl py-12 text-center">
        <p className="text-sm font-medium text-gray-500">No items scheduled this month.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    posted: "bg-gray-100 text-gray-900 border-gray-300",
    scheduled: "bg-gray-50 text-gray-700 border-gray-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const isToday = isCurrentMonth && day === today.getDate();
        return (
          <div key={day} className={`bg-white rounded-xl shadow-sm border p-4 ${isToday ? "ring-2 ring-gray-500/20 border-gray-200" : "border-gray-200"}`}>
            <div className="font-black text-sm mb-3 text-gray-900 flex items-center justify-between">
               <span>{today.toLocaleString("default", { month: "short" })} {day}</span>
               {isToday && <span className="text-[10px] font-bold text-white bg-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>}
            </div>
            <div className="space-y-2">
              {grouped[day].map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}/edit`}
                  className={`flex items-center justify-between gap-3 p-2 rounded-lg border text-xs transition-colors ${statusColors[post.status] || "bg-gray-50 border-gray-200 text-gray-700"}`}
                >
                  <span className="font-bold truncate flex-1">{post.content?.slice(0, 50) || ""}...</span>
                  <span className="font-black shrink-0 tabular-nums">
                    {post.scheduledAt?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-gray-600" /></div>}>
        <CalendarContent />
      </Suspense>
    </ProtectedRoute>
  );
}
