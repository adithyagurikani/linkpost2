"use client";
import api from "@/lib/api-client";

import { useState, useEffect } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";

export default function BriefButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  const fetchBrief = async () => {
    setLoading(true);
    setError("");
    setSummary("");
    try {
      const data = await api.post<any>("/ai/brief", { days: 7 });
      setSummary(data.summary);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          if (!summary && !error && !loading) fetchBrief();
        }}
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-500/20"
      >
        <Sparkles className="w-4 h-4" />
        Brief Me
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">AI Brief</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                  <span className="ml-3 text-gray-500 font-medium">Analyzing activity...</span>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                  {error}
                </div>
              )}
              {summary && !loading && (
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">Last 7 days</span>
              <div className="flex gap-2">
                <button
                  onClick={fetchBrief}
                  disabled={loading}
                  className="text-sm font-medium text-gray-600 hover:text-gray-700 disabled:opacity-50"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
