"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";
import SchedulesClient from "./SchedulesClient";
import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { Plus, Clock, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const data = await api.get<any[]>("/schedules");
        setSchedules(data);
      } catch (err) {
        console.error("Failed to fetch schedules:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);

  const headerActions = (
    <Link
      href="/schedules/new"
      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-500/20"
    >
      <Plus className="w-4 h-4" /> Create Schedule
    </Link>
  );

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
        title="Schedules"
        description="Define recurring posting times to automate your content distribution."
        breadcrumbs={[{ label: "Schedules" }]}
        actions={headerActions}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
          {!schedules || schedules.length === 0 ? (
            <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
               <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
               <p className="text-gray-500 font-medium mb-4">No schedules created yet.</p>
               <Link
                 href="/schedules/new"
                 className="inline-flex items-center gap-2 bg-white border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
               >
                  Create First Schedule
               </Link>
            </div>
          ) : (
            <SchedulesClient schedules={schedules} />
          )}
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
