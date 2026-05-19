"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api-client";
import PostForm from "../PostForm";

import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewPostPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any[]>("/accounts")
      .then((data) =>
        setAccounts(
          data
            .filter((a: any) => a.isActive)
        )
      )
      .catch((e) => console.error("Failed to load accounts:", e))
      .finally(() => setLoading(false));
  }, []);

  const headerActions = (
    <Link
      href="/posts"
      className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
    >
      <ChevronLeft className="w-4 h-4" /> Cancel
    </Link>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <PageContainer
          title="New Post"
          breadcrumbs={[{ label: "Posts", href: "/posts" }, { label: "New" }]}
          actions={headerActions}
        >
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer
        title="New Post"
        description="Create a new LinkedIn post with AI-powered writing tools and scheduling."
        breadcrumbs={[{ label: "Posts", href: "/posts" }, { label: "New" }]}
        actions={headerActions}
      >
        <PostForm accounts={accounts as any} />
      </PageContainer>
    </ProtectedRoute>
  );
}

