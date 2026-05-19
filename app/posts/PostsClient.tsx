"use client";

import api from "@/lib/api-client";
import { useEffect, useState, useMemo, useCallback, useDeferredValue, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/SkeletonCard";
import { useConfirm } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  errorMessage: string | null;
  shareUrl: string | null;
  account: { name: string; id?: string } | null;
  likes?: number;
  comments?: number;
}

const PostCardItem = memo(function PostCardItem({ post, selected, onToggle, onPostNow }: { post: Post; selected: boolean; onToggle: (id: string) => void; onPostNow: (id: string) => void }) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const handleDelete = useCallback(async () => {
    if (!await confirm({ title: "Delete Post", message: "Are you sure you want to permanently delete this post?", variant: "danger" })) return;
    try {
      await api.delete(`/posts/${post.id}`);
      router.refresh();
      // Also update local state for immediate feedback
      onToggle(post.id); // This will clear selection if needed
    } catch {
      toast("Failed to delete post.", "error");
    }
  }, [post.id, router, confirm, onToggle, toast]);

  const handlePostNow = useCallback(async () => {
    if (!await confirm({ title: "Publish Now", message: "Post to LinkedIn immediately?", confirmLabel: "Publish", variant: "primary" })) return;
    onPostNow(post.id);
  }, [post.id, onPostNow, confirm]);

  return (
    <div className="flex items-start gap-3">
      <div className="pt-5 pl-1">
        <input type="checkbox" checked={selected} onChange={() => onToggle(post.id)}
          className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500 cursor-pointer" />
      </div>
      <div className="flex-1">
        <PostCard
          id={post.id}
          content={post.content}
          status={post.status}
          scheduledAt={post.scheduledAt}
          postedAt={post.postedAt}
          accountName={post.account?.name || null}
          errorMessage={post.errorMessage}
          shareUrl={post.shareUrl}
          likes={post.likes}
          comments={post.comments}
          onDelete={handleDelete}
          onPostNow={handlePostNow}
        />
      </div>
    </div>
  );
});

const tabs = [
  { label: "All", status: "all" },
  { label: "Drafts", status: "draft" },
  { label: "Scheduled", status: "scheduled" },
  { label: "Posted", status: "posted" },
  { label: "Failed", status: "failed" },
];

export default function PostsClient({
  statusFilter,
  isScheduleView,
}: {
  statusFilter: string;
  isScheduleView: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const router = useRouter();

  const fetchPosts = async (pageNum = page) => {
    setLoading(true);
    try {
      const result = await api.get<any>("/posts", {
        status: statusFilter !== "all" ? statusFilter : undefined,
        view: isScheduleView ? "schedule" : undefined,
        page: pageNum,
        limit: 50,
      });
      setPosts(result.posts || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      toast("Failed to load posts.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPosts(1);
  }, [statusFilter, isScheduleView]);

  // Native local search for lightning fast typing feedback
  const deferredSearch = useDeferredValue(searchQuery);
  const isSearchStale = searchQuery !== deferredSearch;

  const filteredPosts = useMemo(() => {
    if (!deferredSearch.trim()) return posts;
    const low = deferredSearch.toLowerCase();
    return posts.filter(p => 
      p.content.toLowerCase().includes(low) ||
      (p.account?.name && p.account.name.toLowerCase().includes(low)) ||
      p.status.toLowerCase().includes(low)
    );
  }, [posts, deferredSearch]);

  const { confirm } = useConfirm();
  const { toast } = useToast();

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map(p => p.id)));
    }
  }, [filteredPosts, selectedIds.size]);

  const handlePostNow = useCallback(async (id: string) => {
    try {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "posting" } : p));
      await api.post(`/posts/${id}/post-now`);
      router.refresh();
      toast("Post pushed to LinkedIn successfully!", "success");
    } catch (err: any) {
      toast(err.message || "Failed to publish post.", "error");
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "failed", errorMessage: "Network error" } : p));
    }
  }, [router, toast]);

  const handleDuplicate = useCallback(async (id: string) => {
    const original = posts.find(p => p.id === id);
    if (!original) return;
    try {
      await api.post("/posts", { content: original.content, accountId: original.account?.id });
      router.refresh();
      toast("Post duplicated successfully.", "success");
    } catch {
      toast("Failed to duplicate post.", "error");
    }
  }, [posts, router, toast]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!await confirm({ title: "Delete Selected", message: `Delete ${selectedIds.size} post(s)? This cannot be undone.`, confirmLabel: "Delete All", variant: "danger" })) return;
    setBatchDeleting(true);
    try {
      await api.post("/posts/batch-delete", { ids: Array.from(selectedIds) });
      toast(`Deleted ${selectedIds.size} post(s).`, "success");
      setPosts(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast("Failed to delete some posts.", "error");
    } finally {
      setBatchDeleting(false);
    }
  }, [selectedIds, confirm, toast, router]);

  const handleDelete = useCallback(async (id: string) => {
    if (!await confirm({ title: "Delete Post", message: "Are you sure you want to permanently delete this post?", variant: "danger" })) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      router.refresh();
      toast("Post deleted successfully.", "success");
    } catch {
      toast("Failed to delete post.", "error");
    }
  }, [router, confirm, toast]);

  return (
    <div>

      <div className="flex flex-col gap-5 mb-8">
        {/* Enhanced Dynamic Search Interface */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gray-400 group-focus-within:text-gray-500 transition-colors">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
          <input
            type="text"
            placeholder="Search keywords, accounts or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={filteredPosts.length > 0 && selectedIds.size === filteredPosts.length} onChange={selectAll}
              className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500 cursor-pointer" />
            Select All
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Mobile Tabs - Horizontal Scrollable */}
          <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth">
            {tabs.map((tab) => (
              <Link
                key={tab.status}
                href={`/posts?status=${tab.status}${isScheduleView ? "&view=schedule" : ""}`}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  statusFilter === tab.status
                    ? "bg-white text-gray-600 shadow-sm border border-gray-100"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <Link
            href={`/posts?status=${statusFilter}&view=${isScheduleView ? "" : "schedule"}`}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
              isScheduleView
                ? "bg-gray-600 text-white border-gray-600 shadow-lg shadow-gray-100"
                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {isScheduleView ? (
               <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> List View</>
            ) : (
               <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002-2z" /></svg> Schedule View</>
            )}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : isSearchStale ? (
        <div className="grid grid-cols-1 gap-4 opacity-50">
          {filteredPosts.map((post) => (
            <PostCardItem key={post.id} post={post} selected={selectedIds.has(post.id)} onToggle={toggleSelected} onPostNow={handlePostNow} />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
          <div className="bg-white w-16 h-16 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
             <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
             {searchQuery ? "No matching posts found" : "No posts in this category"}
          </p>
        </div>
      ) : isScheduleView ? (
        <ScheduleView posts={filteredPosts} onDelete={handleDelete} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map((post) => (
            <PostCardItem key={post.id} post={post} selected={selectedIds.has(post.id)} onToggle={toggleSelected} onPostNow={handlePostNow} />
          ))}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-20 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-center justify-between animate-slide-up">
          <span className="text-sm font-bold text-gray-700">{selectedIds.size} selected</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds(new Set())} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
              Clear
            </button>
            <button onClick={handleBatchDelete} disabled={batchDeleting}
              className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-200">
              {batchDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
            </button>
          </div>
        </div>
      )}

      {totalPages > 1 && !searchQuery && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{total} Total Posts</p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => fetchPosts(page - 1)}
              disabled={page <= 1}
              className="flex-1 sm:flex-none px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              Prev
            </button>
            <div className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
               {page} <span className="opacity-30">/</span> {totalPages}
            </div>
            <button
              onClick={() => fetchPosts(page + 1)}
              disabled={page >= totalPages}
              className="flex-1 sm:flex-none px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleView({ posts, onDelete }: { posts: Post[], onDelete: (id: string) => void }) {
  const grouped: Record<string, Post[]> = {};
  posts.forEach((post) => {
    if (!post.scheduledAt) return;
    const day = post.scheduledAt.slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(post);
  });

  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="space-y-10">
      {sortedDays.map((day) => (
        <div key={day} className="relative">
          <div className="flex items-center gap-4 mb-6 sticky top-[4.5rem] bg-[#F6F7F9]/80 backdrop-blur-md py-2 z-10">
             <div className="bg-gray-600 text-white w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-lg shadow-gray-100">
                <div className="text-[10px] font-black leading-none uppercase">{new Date(day).toLocaleDateString('default', { month: 'short' })}</div>
                <div className="text-xl font-black leading-none">{new Date(day).getDate()}</div>
             </div>
             <div>
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight leading-none">{new Date(day).toLocaleDateString('default', { weekday: 'long' })}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(day).toLocaleDateString('default', { year: 'numeric', month: 'long' })}</p>
             </div>
          </div>
          
          <div className="space-y-3 relative pl-6 ml-6 border-l-2 border-gray-200/50">
            {grouped[day].map((post) => (
              <div
                key={post.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gray-100 hover:shadow-xl hover:shadow-gray-500/5 transition-all group relative"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[1.65rem] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-400 z-10"></div>
                
                <div className="flex items-center justify-between sm:w-24 shrink-0">
                   <div className="text-xs font-black text-gray-600 uppercase tracking-tighter">
                     {new Date(post.scheduledAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <div className="sm:hidden">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                         post.status === "posted" ? "bg-gray-100 text-gray-900" : 
                         post.status === "scheduled" ? "bg-gray-50 text-gray-600" : "bg-gray-50 text-gray-400"
                      }`}>
                         {post.status}
                      </span>
                   </div>
                </div>

                <div className="flex-1 text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-900 transition-colors">{post.content}</div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-gray-50 sm:border-0 pt-3 sm:pt-0">
                  <div className="hidden sm:block">
                     <span
                       className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                         post.status === "posted"
                           ? "bg-gray-100 text-gray-900"
                           : post.status === "scheduled"
                             ? "bg-gray-50 text-gray-600"
                             : "bg-gray-50 text-gray-400"
                       }`}
                     >
                       {post.status}
                     </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/posts/${post.id}/edit`} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors bg-gray-50/50 px-3 py-1.5 rounded-lg">Edit</Link>
                    <button onClick={() => onDelete(post.id)} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors bg-red-50/50 px-3 py-1.5 rounded-lg">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
