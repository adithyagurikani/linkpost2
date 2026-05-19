"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api-client";
import PageContainer from "@/components/PageContainer";
import PromptsForm from "./PromptsForm";
import { DEFAULT_PROMPTS } from "@/lib/prompts-defaults";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Record<string, string>>("/settings/prompts")
      .then(setPrompts)
      .catch((e) => console.error("Failed to load prompts:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <PageContainer
          title="AI Prompt Configuration"
          breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "AI Prompts" }]}
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
        title="AI Prompt Configuration"
        description="Customize the AI system prompts used for content generation, hashtag injection, and pre-publish analysis."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "AI Prompts" }]}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 max-w-3xl">
          <PromptsForm prompts={prompts} defaults={DEFAULT_PROMPTS} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
