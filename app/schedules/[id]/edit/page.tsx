"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { use } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api-client";
import ScheduleForm from "../../ScheduleForm";

import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [schedule, setSchedule] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>(`/schedules/${id}`),
      api.get<any[]>("/accounts"),
    ])
      .then(([scheduleData, accountsData]) => {
        setSchedule(scheduleData);
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
      href="/schedules"
      className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
    >
      <ChevronLeft className="w-4 h-4" /> Back to Recurrence
    </Link>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <PageContainer
title="Edit Schedule"
          breadcrumbs={[{ label: "Schedules", href: "/schedules" }, { label: "Edit" }]}
          actions={headerActions}
        >
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  if (!schedule) return null;

  return (
    <ProtectedRoute>
      <PageContainer
        title="Adjust Cadence"
        description="Modify persistent timetable conditions for specified system triggers."
        breadcrumbs={[{ label: "Schedules", href: "/schedules" }, { label: "Edit" }]}
        actions={headerActions}
      >
        <ScheduleForm
          accounts={accounts as any}
          initial={{
            id: schedule.id,
            name: schedule.name,
            accountId: schedule.accountId,
            times: schedule.times || ["08:00"],
            contentTemplate: schedule.contentTemplate,
          }}
        />
      </PageContainer>
    </ProtectedRoute>
  );
}

