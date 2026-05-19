"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { use } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api-client";
import SourceForm from "../../SourceForm";

import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any>(`/sources/${id}`)
      .then(setSource)
      .catch(() => notFound())
      .finally(() => setLoading(false));
  }, [id]);

  const headerActions = (
    <Link
      href="/sources"
      className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
    >
      <ChevronLeft className="w-4 h-4" /> Back to Library
    </Link>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <PageContainer
title="Edit Source"
          breadcrumbs={[{ label: "Sources", href: "/sources" }, { label: "Edit" }]}
          actions={headerActions}
        >
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  if (!source) return null;

  return (
    <ProtectedRoute>
      <PageContainer
        title="Reconfigure Vector"
        description="Update existing input source specifications and stored intellectual artifacts."
        breadcrumbs={[{ label: "Sources", href: "/sources" }, { label: "Edit" }]}
        actions={headerActions}
      >
        <SourceForm
          initial={{
            id: source.id,
            name: source.name,
            sourceType: source.sourceType,
            content: source.content,
          }}
        />
      </PageContainer>
    </ProtectedRoute>
  );
}

