"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";

export default function SystemTasks() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerTask = async (type: "optimize" | "sync") => {
    setRunning(true);
    setStatus(`Running ${type}...`);

    try {
      const endpoint =
        type === "optimize"
          ? "/system/optimize"
          : "/system/sync-analytics";

      const data = await api.post<{ message?: string }>(endpoint);
      setStatus(`✅ ${data.message || "Done"}`);
      router.refresh();
    } catch (err: any) {
      setStatus(`❌ ${err.message || "Network fault."}`);
    } finally {
      setRunning(false);
      timeoutRef.current = setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="space-y-0.5">
           <h3 className="font-black text-gray-900 text-xs uppercase tracking-[0.2em]">
             System Operations
           </h3>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manual Override Triggers</p>
        </div>
        {status && (
          <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded-lg animate-pulse shadow-lg shadow-black/10">
            {status}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => triggerTask("optimize")}
          disabled={running}
          className="group flex items-center justify-between gap-2 bg-gray-50 hover:bg-black hover:text-white text-gray-700 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <span>Batch Tag Optimizer</span>
          <span className="bg-gray-200 group-hover:bg-white/20 text-gray-900 group-hover:text-white p-1 rounded-md transition-colors">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </span>
        </button>

        <button
          onClick={() => triggerTask("sync")}
          disabled={running}
          className="group flex items-center justify-between gap-2 bg-gray-50 hover:bg-emerald-600 hover:text-white text-gray-700 border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <span>Sync Network Analytics</span>
          <span className="bg-emerald-100 group-hover:bg-white/20 text-emerald-600 group-hover:text-white p-1 rounded-md transition-colors">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </span>
        </button>
      </div>
    </div>
  );
}
