"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { use } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api-client";
import PostForm from "../../PostForm";

import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>(`/posts/${id}`),
      api.get<any[]>("/accounts"),
    ])
      .then(([postData, accountsData]) => {
        setPost(postData);
        setAccounts(
          accountsData
            .filter((a: any) => a.isActive)
        );
      })
      .catch(() => notFound())
      .finally(() => setLoading(false));
  }, [id]);

  const headerActions = (
    <Link
      href="/posts"
      className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
    >
      <ChevronLeft className="w-4 h-4" /> Back to Archive
    </Link>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <PageContainer
title="Edit Post"
          breadcrumbs={[{ label: "Posts", href: "/posts" }, { label: "Edit" }]}
          actions={headerActions}
        >
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  if (!post) return null;

  return (
    <ProtectedRoute>
      <PageContainer
        title="Modify Execution"
        description="Update active parameters for queued distribution components."
        breadcrumbs={[{ label: "Posts", href: "/posts" }, { label: "Edit" }]}
        actions={headerActions}
      >
        <PostForm
          accounts={accounts as any}
          initial={{
            id: post.id,
            content: post.content,
            accountId: post.accountId,
            status: post.status,
            scheduledAt: post.scheduledAt
              ? new Date(post.scheduledAt).toLocaleString("sv-SE").replace(" ", "T").slice(0, 16)
              : null,
          }}
        />
      </PageContainer>
    </ProtectedRoute>
  );
}

