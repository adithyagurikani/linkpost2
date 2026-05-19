"use client";

import { useEffect, useState, Suspense } from "react";
import api from "@/lib/api-client";
import LogsClient from "./LogsClient";
import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSearchParams } from "next/navigation";

function LogsContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const action = searchParams.get("action") || undefined;
  const entityType = searchParams.get("entityType") || undefined;

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const result = await api.get<any>("/logs", {
          page,
          action,
          entityType,
        });
        setData(result);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [page, action, entityType]);

  const hasFilters = !!(action || entityType);
  const headerActions = hasFilters ? (
    <Link
      href="/logs"
      className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
    >
      <XCircle className="w-4 h-4" /> Clear Filters
    </Link>
  ) : undefined;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const actionCounts = data?.actionCounts || [];
  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  return (
    <PageContainer
        title="Audit Logs"
        description={`A chronological record of all system activity. ${total} total events logged.`}
      breadcrumbs={[{ label: "Logs" }]}
      actions={headerActions}
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <LogsClient
          logs={logs}
          total={total}
          page={page}
          totalPages={totalPages}
          actionCounts={actionCounts}
          currentAction={action || ""}
          currentEntityType={entityType || ""}
        />
      </div>
    </PageContainer>
  );
}

export default function LogsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-gray-600" /></div>}>
        <LogsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
