"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api-client";
import SystemTasks from "@/components/SystemTasks";
import DashboardStatsLive from "@/components/DashboardStatsLive";
import BriefButton from "./BriefButton";
import Link from "next/link";
import { ArrowRight, Calendar, MoreVertical, Users, Clock, Pencil, Trash2, ExternalLink, Send, Zap } from "lucide-react";
import { detectTimezone, getTzAbbr } from "@/lib/schedule-utils";

interface Post {
  id: string;
  content: string;
  scheduledAt: string | null;
  status: string;
  shareUrl?: string;
}

interface Account {
  id: string;
  name: string;
  avatarUrl: string | null;
  isActive: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [upcomingPosts, setUpcomingPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ posts: Post[] }>("/posts?view=upcoming&limit=5"),
      api.get<Account[]>("/accounts"),
    ])
      .then(([postsRes, accs]) => {
        setUpcomingPosts(postsRes.posts);
        setAccounts(accs);
      })
      .catch((e) => console.error("Dashboard load failed:", e))
      .finally(() => setLoaded(true));
  }, []);

  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`);
      setUpcomingPosts((prev) => prev.filter((p) => p.id !== postId));
      setOpenPostMenu(null);
    } catch (err) {
      console.error("Delete post failed:", err);
    }
  };

  const handlePostNow = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/post-now`);
      setUpcomingPosts((prev) => prev.filter((p) => p.id !== postId));
      setOpenPostMenu(null);
    } catch (err) {
      console.error("Post now failed:", err);
    }
  };

  const userFirstName = user?.username?.split(" ")[0] || "Admin";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F6F7F9] pb-12">
        {/* Top Contrast Canopy */}
        <div className="bg-[#111317] text-white pt-10 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-6 tracking-wider">
              <div className="flex items-center gap-2">
                <span>Overview</span>
                <span className="opacity-50">/</span>
                <span className="text-gray-300">Dashboard</span>
              </div>
              <div className="hidden sm:block text-gray-400">{currentDate}</div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                  Welcome back, {userFirstName}
                </h1>
                <p className="text-gray-400 text-base max-w-lg">
                  Your posting schedule is running. View your stats and upcoming
                  posts below.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <BriefButton />
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  Next 7 days
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          <DashboardStatsLive />
        </div>

        {/* Next Up Hero — only when loaded and posts exist */}
        {loaded && upcomingPosts.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl shadow-black/10 border border-gray-700 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Next Post
                </div>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 font-bold text-base sm:text-lg leading-relaxed line-clamp-3 mb-4">
                      {upcomingPosts[0].content}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {upcomingPosts[0].scheduledAt
                          ? new Date(upcomingPosts[0].scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Pending"}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {upcomingPosts[0].scheduledAt
                          ? new Date(upcomingPosts[0].scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                          : "ASAP"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {detectTimezone()} / {getTzAbbr(detectTimezone())}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/posts/${upcomingPosts[0].id}/edit`}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => handlePostNow(upcomingPosts[0].id)}
                      className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <Send className="w-3.5 h-3.5" /> Post Now
                    </button>
                  </div>
                </div>
              </div>
              {/* Progress bar: how many posts today vs remaining */}
              {(() => {
                const today = new Date().toDateString();
                const todaysPosts = upcomingPosts.filter(
                  (p) => p.scheduledAt && new Date(p.scheduledAt).toDateString() === today
                );
                if (todaysPosts.length === 0) return null;
                const postedToday = 0; // We'd need a separate endpoint for real data
                return (
                  <div className="border-t border-gray-700 px-6 sm:px-8 py-3 flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Today&apos;s Queue
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-xs">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (postedToday / todaysPosts.length) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      {postedToday}/{todaysPosts.length} posted
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Dashboard Body Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Left: Upcoming Feed Card */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="space-y-0.5">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">
                    Upcoming Posts
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Scheduled and queued content
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/posts?status=scheduled"
                    className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/posts/new"
                    className="text-xs font-black uppercase tracking-widest text-white bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl transition-all shadow-lg shadow-gray-100 flex items-center gap-2"
                  >
                    New Post <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {!loaded ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-gray-50 rounded-2xl p-4 animate-pulse h-20" />
                    ))}
                  </div>
                ) : upcomingPosts.length === 0 ? (
                  <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="bg-white w-16 h-16 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                      No upcoming posts scheduled
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingPosts.map((post) => (
                      <div
                        key={post.id}
                        className="group bg-white border border-gray-100 hover:border-gray-100 hover:shadow-xl hover:shadow-gray-500/5 rounded-2xl p-4 transition-all flex items-start gap-4"
                      >
                        <div className="bg-gray-50 p-3 rounded-xl text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-50 transition-all border border-gray-50 flex-shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-bold text-sm sm:text-base line-clamp-2 leading-snug mb-3 group-hover:text-gray-900 transition-colors">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                            <span className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">
                              <Clock className="w-3 h-3" />{" "}
                              {post.scheduledAt
                                ? new Date(post.scheduledAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )
                                : "Pending"}
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">
                              {post.scheduledAt
                                ? new Date(
                                    post.scheduledAt
                                  ).toLocaleDateString()
                                : "ASAP"}
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                           <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPostMenu(openPostMenu === post.id ? null : post.id);
                            }}
                            className="text-gray-300 hover:text-gray-600 transition-colors p-1"
                            aria-label="Post actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openPostMenu === post.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-20 animate-slide-up">
                              <Link
                                href={`/posts/${post.id}/edit`}
                                onClick={() => setOpenPostMenu(null)}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg mx-1 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </Link>
                              <button
                                onClick={() => handlePostNow(post.id)}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-lg mx-1 w-full transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" /> Post Now
                              </button>
                              {post.shareUrl ? (
                                <a
                                  href={post.shareUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenPostMenu(null)}
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg mx-1 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> View on LinkedIn
                                </a>
                              ) : (
                                <Link
                                  href={`/posts/${post.id}/edit`}
                                  onClick={() => setOpenPostMenu(null)}
                                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg mx-1 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </Link>
                              )}
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg mx-1 w-full transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System Tasks Module */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1">
              <SystemTasks />
            </div>
          </div>

          {/* Sidebar Right */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="space-y-0.5">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">
                    Linked Accounts
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Connected LinkedIn profiles
                  </p>
                </div>
                <Link
                  href="/accounts"
                  className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-gray-700 flex items-center gap-1 transition-colors"
                >
                  Accounts <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 sm:p-6">
                {!loaded ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="bg-gray-50 rounded-2xl p-4 animate-pulse h-16" />
                    ))}
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                      No accounts connected
                    </p>
                    <Link
                      href="/accounts"
                      className="inline-block text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      Connect Account
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-100 transition-all group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative flex-shrink-0">
                            {acc.avatarUrl ? (
                              <img
                                src={acc.avatarUrl}
                                alt=""
                                className="w-11 h-11 rounded-xl object-cover ring-4 ring-gray-50 group-hover:ring-gray-50 shadow-sm transition-all"
                              />
                            ) : (
                              <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-600 transition-all">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                            <div
                              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${acc.isActive ? "bg-black" : "bg-gray-300"}`}
                            ></div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-gray-900 truncate group-hover:text-gray-600 transition-colors">
                              {acc.name}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                              LinkedIn Account
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System status card */}
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-800 rounded-2xl p-7 text-white shadow-2xl shadow-gray-500/20 flex flex-col h-52 relative overflow-hidden group">
              <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10 flex-1">
                <div className="text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] mb-2">
                  System Status
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-2 leading-tight tracking-tight">
                  All systems operational.
                </h3>
                <p className="text-gray-200/60 text-xs font-bold uppercase tracking-wider">
                  Your automation pipeline is running
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.15em] bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>{" "}
                Pipeline Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
