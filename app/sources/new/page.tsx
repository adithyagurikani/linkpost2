"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SourceForm from "../SourceForm";

import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewSourcePage() {
  const headerActions = (
    <Link
      href="/sources"
      className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
    >
      <ChevronLeft className="w-4 h-4" /> Cancel
    </Link>
  );

  return (
    <ProtectedRoute>
      <PageContainer
        title="New Source"
        description="Define novel ingestion parameters for subsequent dynamic analysis routing."
        breadcrumbs={[{ label: "Sources", href: "/sources" }, { label: "New" }]}
        actions={headerActions}
      >
        <SourceForm />
      </PageContainer>
    </ProtectedRoute>
  );
}

