"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ScheduleCard from "@/components/ScheduleCard";

interface Schedule {
  id: string;
  name: string;
  times: string[];
  timezone: string;
  contentTemplate: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  account: { name: string } | null;
}

export default function SchedulesClient({
  schedules: initial,
}: {
  schedules: Schedule[];
}) {
  const router = useRouter();

  return (
    <div>
      {initial.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="bg-white w-16 h-16 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">No recurrence triggers established</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em]">
            Create a schedule to automatically generate and publish posts at specified times each day
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {initial.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onToggle={router.refresh}
              onDelete={router.refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}