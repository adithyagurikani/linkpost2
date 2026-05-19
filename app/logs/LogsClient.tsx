"use client";

import Link from "next/link";
import { useState } from "react";

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  error: string | null;
  userId: string | null;
  createdAt: string;
}

interface ActionCount {
  action: string;
  count: number;
}

export default function LogsClient({
  logs,
  total,
  page,
  totalPages,
  actionCounts,
  currentAction,
  currentEntityType,
}: {
  logs: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
  actionCounts: ActionCount[];
  currentAction: string;
  currentEntityType: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>

    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        {actionCounts.map(a => (
          <Link
            key={a.action}
            href={`/logs?action=${a.action}${currentEntityType ? `&entityType=${currentEntityType}` : ""}`}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              currentAction === a.action
                ? "bg-gray-600 text-white border-gray-600 shadow-lg shadow-gray-100"
                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
            }`}
          >
            {a.action} <span className="opacity-50 ml-1">{a.count}</span>
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
           <div className="bg-white w-16 h-16 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No activity recorded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {logs.map(log => (
            <div
              key={log.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-gray-100 group"
            >
              <button
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center justify-between sm:justify-start gap-4">
                   <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${log.error ? "bg-red-500 animate-pulse" : "bg-black"}`} />
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest sm:w-40 shrink-0 font-mono">
                     {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-1">
                   <span className="text-[10px] font-black text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg uppercase tracking-tight">
                     {log.action}
                   </span>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     {log.entityType}{log.entityId ? `:${log.entityId.slice(0, 8)}` : ""}
                   </span>
                   <span className="text-[10px] font-bold text-gray-400 truncate flex-1 ml-auto sm:ml-0 opacity-60">
                     {log.error ? log.error : log.metadata ? JSON.stringify(log.metadata) : ""}
                   </span>
                </div>
              </button>
              
              {expanded === log.id && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4 text-[10px] font-bold text-gray-500 space-y-3 bg-gray-50/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="uppercase tracking-[0.2em] text-gray-400 mb-1">Event ID</p>
                      <p className="font-mono text-gray-700 bg-white p-2 rounded-xl border border-gray-100">{log.id}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.2em] text-gray-400 mb-1">User</p>
                      <p className="font-mono text-gray-700 bg-white p-2 rounded-xl border border-gray-100">{log.userId || "System Admin"}</p>
                    </div>
                  </div>
                  
                  {log.error && (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <p className="uppercase tracking-[0.2em] text-red-400 mb-1">Error Details</p>
                      <p className="font-mono text-red-600 break-all">{log.error}</p>
                    </div>
                  )}
                  
                  {log.metadata && (
                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                      <p className="uppercase tracking-[0.2em] text-gray-400 mb-2">Metadata</p>
                      <pre className="font-mono text-gray-600 whitespace-pre-wrap break-all text-[9px] leading-relaxed">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-[0.3em] opacity-40">
                    <span>ISO: {new Date(log.createdAt).toISOString()}</span>
                    <span>System Log</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{total} Transactions logged</p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/logs?page=${page - 1}${currentAction ? `&action=${currentAction}` : ""}${currentEntityType ? `&entityType=${currentEntityType}` : ""}`}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-center ${
                page <= 1 ? "opacity-20 pointer-events-none" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Prev
            </Link>
            <div className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
               {page} <span className="opacity-30">/</span> {totalPages}
            </div>
            <Link
              href={`/logs?page=${page + 1}${currentAction ? `&action=${currentAction}` : ""}${currentEntityType ? `&entityType=${currentEntityType}` : ""}`}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-center ${
                page >= totalPages ? "opacity-20 pointer-events-none" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
