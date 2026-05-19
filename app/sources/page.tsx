"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import SourcesClient from "./SourcesClient";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

export default function SourcesPage() {
  const [data, setData] = useState<{ sources: any[]; accounts: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sources, accounts] = await Promise.all([
          api.get<any[]>("/sources"),
          api.get<any[]>("/accounts"),
        ]);
        setData({ sources, accounts });
      } catch (err) {
        console.error("Failed to fetch sources/accounts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
      <SourcesClient sources={data?.sources || []} accounts={data?.accounts || []} />
    </ProtectedRoute>
  );
}
