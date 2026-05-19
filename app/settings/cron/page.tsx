"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api-client";
import PageContainer from "@/components/PageContainer";
import { Clock, Plus, Trash2, Save } from "lucide-react";

const TIMEZONES = ["UTC", "Asia/Kolkata", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Europe/Paris", "Australia/Sydney", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo"];

const DEFAULT_TIMES = ["08:00", "13:00", "18:00"];

function to24Hour(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${m?.padStart(2, "0") || "00"}`;
}

export default function CronSettingsPage() {
  const [times, setTimes] = useState<string[]>([]);
  const [timezone, setTimezone] = useState("UTC");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ times: string[]; timezone: string; isActive: boolean }>("/settings/cron")
      .then((data) => {
        setTimes(data.times?.length ? data.times : DEFAULT_TIMES);
        setTimezone(data.timezone || "UTC");
        setIsActive(data.isActive !== false);
      })
      .catch((e) => console.error("Failed to load cron config:", e))
      .finally(() => setLoading(false));
  }, []);

  const addTime = () => {
    const used = new Set(times);
    for (const t of ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]) {
      if (!used.has(t)) {
        setTimes([...times, t].sort());
        return;
      }
    }
  };

  const removeTime = (idx: number) => {
    if (times.length <= 1) return;
    setTimes(times.filter((_, i) => i !== idx));
  };

  const updateTime = (idx: number, val: string) => {
    const next = [...times];
    next[idx] = to24Hour(val);
    setTimes(next.sort());
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put<{ times: string[]; timezone: string; isActive: boolean }>("/settings/cron", { times, timezone, isActive });
      setTimes(res.times);
      setMessage("Cron schedule updated successfully.");
    } catch (e: any) {
      setMessage(`Error: ${e.message || "Save failed"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PageContainer title="Cron Schedule" breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Cron" }]}>
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer
        title="Cron Schedule"
        description="Configure when the auto-posting pipeline runs each day. Changes take effect immediately."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Cron" }]}
      >
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
              <div className="bg-gray-900 p-2.5 rounded-xl">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Heavy Pipeline Schedule</h3>
                <p className="text-sm text-gray-500">Set when the heavy pipeline runs (hashtag optimization + analytics sync). The scheduling + publishing pipeline runs automatically every 15 minutes.</p>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="font-semibold text-gray-900 text-sm">Enable Cron Pipeline</div>
                <div className="text-xs text-gray-500">When disabled, no automatic posting occurs</div>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative w-12 h-7 rounded-full transition-colors ${isActive ? "bg-gray-900" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Timezone */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium bg-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {/* Times */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Run Times ({times.length})</label>
                <button
                  onClick={addTime}
                  disabled={times.length >= 8}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Time
                </button>
              </div>
              <div className="space-y-2">
                {times.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => updateTime(i, e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium bg-white"
                    />
                    <button
                      onClick={() => removeTime(i)}
                      disabled={times.length <= 1}
                      className="p-3 text-gray-400 hover:text-red-500 disabled:opacity-20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gray-900 text-white rounded-2xl py-3.5 font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Schedule"}
            </button>

            {message && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium text-center ${message.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-900"}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
