"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import AnalyticsClient from "./AnalyticsClient";
import PageContainer from "@/components/PageContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<{ stats: any[]; aggregates: any; chartData: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await api.get<any>("/analytics/data");
        setData(result);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
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
      <PageContainer
        title="Analytics"
        description="Track engagement and post performance across your published content."
        breadcrumbs={[{ label: "Analytics" }]}
      >
        <AnalyticsClient 
          stats={data?.stats || []} 
          aggregates={data?.aggregates || { totalLikes: 0, totalComments: 0, totalPosts: 0, hasAnalytics: false }} 
          chartData={data?.chartData || []}
        />
      </PageContainer>
    </ProtectedRoute>
  );
}
