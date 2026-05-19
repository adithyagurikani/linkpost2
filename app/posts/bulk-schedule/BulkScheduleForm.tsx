"use client";
import api from "@/lib/api-client";
import { detectTimezone } from "@/lib/schedule-utils";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Account {
  id: string;
  name: string;
}

export default function BulkScheduleForm({
  accounts,
}: {
  accounts: Account[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [accountId, setAccountId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [times, setTimes] = useState<string[]>(["09:00"]);
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [fileContents, setFileContents] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    scheduled: number;
    daysScheduled: number;
  } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : parsed.posts || parsed.contents || [];
        const contents = arr.map((item: unknown) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            return (item as Record<string, unknown>).content || (item as Record<string, unknown>).text || JSON.stringify(item);
          }
          return String(item);
        });
        setFileContents(contents);
      } catch {
        toast("Invalid JSON file. Please check the format.", "error");
      }
    };
    reader.readAsText(file);
  };

  const addTime = () => setTimes((prev) => [...prev, "12:00"]);
  const removeTime = (idx: number) => setTimes((prev) => prev.filter((_, i) => i !== idx));
  const updateTime = (idx: number, val: string) =>
    setTimes((prev) => prev.map((t, i) => (i === idx ? val : t)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileContents.length === 0) return;
    setSaving(true);
    setResult(null);

    try {
      const data = await api.post<any>("/posts/bulk-schedule", {
        contents: fileContents,
        accountId,
        startDate,
        times,
        postsPerDay,
        timezone: detectTimezone(),
      });

      setResult({ scheduled: data.scheduled, daysScheduled: data.daysScheduled });
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Failed to schedule posts.", "error");
    } finally {
      setSaving(false);
    }
  };

  const totalDays = fileContents.length > 0 ? Math.ceil(fileContents.length / postsPerDay) : 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4 sm:p-8 max-w-2xl space-y-8 animate-slide-up"
    >
      {/* JSON File Upload */}
      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
          Upload JSON File
        </label>
        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center hover:border-gray-400 transition-colors bg-gray-50/50">
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFile}
            className="hidden"
          />
          {fileContents.length > 0 ? (
            <div>
              <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-sm font-bold text-emerald-700">
                ✅ {fileName} — {fileContents.length} post{fileContents.length > 1 ? "s" : ""} loaded
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-gray-700 mt-3 transition-colors"
              >
                Change file
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-gray-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-bold text-gray-600 hover:text-gray-700 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm transition-all"
              >
                Click to upload JSON
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Accepts an array of strings or objects with a <code className="text-gray-500 font-bold">content</code> field
              </p>
            </div>
          )}
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          Upload a JSON file containing the posts you want to schedule in bulk
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
            LinkedIn Account
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all appearance-none"
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
            Which LinkedIn account these posts will be published to
          </p>
        </div>

        {/* Start Date */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all"
          />
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
            The first day posts will begin publishing
          </p>
        </div>
      </div>

      {/* Posting Times */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Posting Times
          </label>
          <button type="button" onClick={addTime} className="text-[10px] font-black text-gray-600 hover:text-gray-700 uppercase tracking-widest transition-colors">
            + Add Time
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {times.map((t, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <input
                type="time"
                value={t}
                onChange={(e) => updateTime(i, e.target.value)}
                required
                className="flex-1 bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all"
              />
              {times.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTime(i)}
                  className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          Times of day each post should be published. Add multiple times for multiple posts per day.
        </p>
      </div>

      {/* Posts Per Day */}
      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
          Posts Per Day
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPostsPerDay(n)}
              className={`py-3 rounded-2xl text-xs font-black transition-all ${postsPerDay === n ? "bg-gray-600 text-white shadow-lg shadow-gray-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          How many posts to publish each day. Posts rotate through your time slots.
        </p>
      </div>

      {/* Summary */}
      {fileContents.length > 0 && startDate && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-gray-600 text-white p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-800 leading-none">Schedule Summary</p>
              <p className="text-[10px] font-bold text-gray-600 mt-1">
                {fileContents.length} posts × {postsPerDay} per day = <strong>{totalDays} days</strong> of content
                {times.length > 1 && postsPerDay > 1 ? ` (${times.length} time slots)` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-2 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-800">Scheduled Successfully</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-1">{result.scheduled} posts across {result.daysScheduled} days</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/posts?status=scheduled")}
            className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-gray-700 bg-white px-4 py-2.5 rounded-xl border border-emerald-100 transition-all"
          >
            View →
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-8 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving || fileContents.length === 0 || !accountId || !startDate}
          className="flex-1 bg-gray-600 text-white px-8 py-4 rounded-2xl hover:bg-gray-700 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-3"
        >
          {saving ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Scheduling...</>
          ) : result ? "Schedule Another Batch" : "Schedule All Posts"}
        </button>
        {result && (
          <button
            type="button"
            onClick={() => router.push("/posts?status=scheduled")}
            className="flex-1 bg-white border border-gray-200 text-gray-400 px-8 py-4 rounded-2xl hover:bg-gray-50 hover:text-gray-700 text-[10px] font-black uppercase tracking-widest transition-all text-center"
          >
            View Scheduled Posts
          </button>
        )}
      </div>
    </form>
  );
}
