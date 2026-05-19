"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import PageContainer from "@/components/PageContainer";
import BriefChat from "./BriefChat";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

export default function BriefPage() {
  const [initialSummary, setInitialSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialBrief() {
      try {
        const { result } = await api.post<any>("/ai/brief", { days: 7 });
        setInitialSummary(result);
      } catch (err) {
        console.error("Failed to fetch initial brief:", err);
        setInitialSummary("Welcome to AI Brief. Ask me anything about your InkPost activity.");
      } finally {
        setLoading(false);
      }
    }
    fetchInitialBrief();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer
        title="AI Brief"
        description="Ask questions about your InkPost activity and get AI-powered summaries."
        breadcrumbs={[{ label: "Brief" }]}
      >
        <BriefChat initialSummary={initialSummary || ""} />
      </PageContainer>
    </ProtectedRoute>
  );
}
