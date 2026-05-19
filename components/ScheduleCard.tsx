"use client";

import { memo } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useConfirm } from "@/components/ConfirmModal";

interface Schedule {
  id: string;
  name: string;
  times: string[];
  timezone: string;
  contentTemplate: string;
  mode?: "template" | "drafts";
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  account: { name: string } | null;
}

const ScheduleCard = memo(function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
}: {
  schedule: Schedule;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    if (!await confirm({ title: "Delete Schedule", message: "Delete this schedule?", variant: "danger" })) return;
    try {
      await api.delete(`/schedules/${schedule.id}`);
      onDelete();
    } catch (err) {
      console.error("Delete schedule failed:", err);
    }
  };

  const handleToggle = async () => {
    try {
      await api.post(`/schedules/${schedule.id}/toggle`);
      onToggle();
    } catch (err) {
      console.error("Toggle schedule failed:", err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 hover:border-black transition-all group">
      <div className="flex flex-col gap-5">
        <div className="flex-1 min-w-0">
           <div className="flex items-center justify-between gap-3 mb-2">
              <div className="font-bold text-gray-900 leading-tight">{schedule.name}</div>
              <div className="flex items-center gap-2">
                 <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${schedule.mode === "drafts" ? "bg-gray-50 text-gray-600 border-gray-100" : "bg-gray-50 text-gray-600 border-gray-100"}`}>
                    {schedule.mode === "drafts" ? "Drafts" : "Template"}
                 </div>
                 <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${schedule.isActive ? "bg-gray-100 text-gray-900 border-gray-300" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                    {schedule.isActive ? "Running" : "Paused"}
                 </div>
              </div>
           </div>
          
          <div className="grid grid-cols-2 gap-4 my-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Times</div>
                 <div className="text-xs font-bold text-gray-700">{schedule.times.join(", ")}</div>
                 {schedule.timezone && schedule.timezone !== "UTC" && (
                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">{schedule.timezone}</div>
                 )}
              </div>
             <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Target Account</div>
                <div className="text-xs font-bold text-gray-700 truncate">{schedule.account?.name || "Global"}</div>
             </div>
          </div>

          <div className="space-y-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
             <div className="flex items-center justify-between">
                 <span>Last Run</span>
                <span className="text-gray-600">{schedule.lastRunAt ? new Date(schedule.lastRunAt).toLocaleString() : "NONE"}</span>
             </div>
             <div className="flex items-center justify-between">
                 <span>Next Run</span>
                <span className="text-black">{schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "STANDBY"}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-4 border-t border-gray-50">
          <Link
            href={`/schedules/${schedule.id}/edit`}
            className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all border border-gray-100 sm:w-auto"
          >
            Edit
          </Link>
          <button
            onClick={handleToggle}
            className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border sm:w-auto ${schedule.isActive ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" : "bg-black text-white border-black hover:bg-gray-800 shadow-md shadow-black/5"}`}
          >
            {schedule.isActive ? "Pause" : "Resume"}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all col-span-2 sm:col-auto sm:ml-auto"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

export default ScheduleCard;
