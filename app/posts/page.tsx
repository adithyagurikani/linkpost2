"use client";

import PostsClient from "./PostsClient";
import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { Plus, Layers, Calendar } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSearchParams } from "next/navigation";

export default function PostsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const isScheduleView = searchParams.get("view") === "schedule";

  const headerActions = (
    <>
      <Link
        href="/posts/bulk-schedule"
        className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
      >
        <Layers className="w-4 h-4" /> Bulk Schedule
      </Link>
      <Link
        href="/posts/reschedule"
        className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
      >
        <Calendar className="w-4 h-4" /> Reschedule
      </Link>
      <Link
        href="/posts/new"
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-500/20"
      >
        <Plus className="w-4 h-4" /> New Post
      </Link>
    </>
  );

  return (
    <ProtectedRoute>
      <PageContainer
        title="Posts Archive"
        description="Browse, schedule, and manage your system distribution tasks."
        breadcrumbs={[{ label: "Posts" }]}
        actions={headerActions}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
          <PostsClient
            statusFilter={statusFilter}
            isScheduleView={isScheduleView}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
