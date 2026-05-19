"use client";
import api from "@/lib/api-client";
import { detectTimezone } from "@/lib/schedule-utils";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
}

export default function ScheduleForm({
  accounts,
  initial,
}: {
  accounts: Account[];
  initial?: {
    id: string;
    name: string;
    accountId: string;
    times: string[];
    contentTemplate: string;
    mode?: "template" | "drafts";
  };
}) {
  const [name, setName] = useState(initial?.name || "");
  const [accountId, setAccountId] = useState(initial?.accountId || "");
  const [postCount, setPostCount] = useState(initial?.times.length || 1);
  const [times, setTimes] = useState<string[]>(
    initial?.times || ["08:00"]
  );
  const [mode, setMode] = useState<"template" | "drafts">(
    initial?.mode || "template"
  );
  const [contentTemplate, setContentTemplate] = useState(
    initial?.contentTemplate || "Here's my {date} update: "
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    try {
      const data = await api.post<any>("/ai/generate", { prompt: aiTopic, mode: "schedule" });
      if (data.response) {
        setContentTemplate(data.response);
      }
    } catch (e: any) {
      setError(e.message || "AI generation failed");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePostCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
    setPostCount(count);
    setTimes((prev) => {
      const updated = [...prev];
      while (updated.length < count) updated.push("12:00");
      return updated.slice(0, count);
    });
  };

  const handleTimeChange = (index: number, value: string) => {
    setTimes((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const timezone = detectTimezone();
    const isEdit = !!initial;
    const url = isEdit ? `/schedules/${initial.id}` : "/schedules";

    try {
      if (isEdit) {
        await api.put(url, {
          name,
          accountId,
          times,
          mode,
          timezone,
          contentTemplate: mode === "template" ? contentTemplate : undefined,
        });
      } else {
        await api.post(url, {
          name,
          accountId,
          times,
          mode,
          timezone,
          contentTemplate: mode === "template" ? contentTemplate : undefined,
        });
      }
      router.push("/schedules");
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4 sm:p-8 max-w-2xl space-y-8 animate-slide-up">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3">{error}</div>
      )}
      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
          Schedule Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Daily Tech Tips"
          className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300"
        />
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          A descriptive name to identify this recurring schedule in your list
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            Which LinkedIn account this schedule will post to
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
            Posts Per Day
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={postCount}
            onChange={handlePostCountChange}
            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all"
          />
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
            How many posts this schedule creates each day (max 10)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Posting Times (IST)
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: postCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 w-6 shrink-0">{i + 1}.</span>
              <input
                type="time"
                value={times[i] || "12:00"}
                onChange={(e) => handleTimeChange(i, e.target.value)}
                required
                className="flex-1 bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all"
              />
            </div>
          ))}
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          Times of day to post (India Standard Time, UTC+5:30). Each time slot generates one post.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
          Schedule Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("template")}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${mode === "template" ? "border-gray-500 bg-gray-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
          >
            <div className={`text-xs font-black uppercase tracking-widest ${mode === "template" ? "text-gray-700" : "text-gray-600"}`}>
              Template
            </div>
            <div className="text-[10px] font-bold text-gray-400 mt-1">
              AI generates new posts from a template at each scheduled time
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode("drafts")}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${mode === "drafts" ? "border-gray-500 bg-gray-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
          >
            <div className={`text-xs font-black uppercase tracking-widest ${mode === "drafts" ? "text-gray-700" : "text-gray-600"}`}>
              Drafts
            </div>
            <div className="text-[10px] font-bold text-gray-400 mt-1">
              Pick up existing draft posts and schedule them at set times
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
          Topic / Description
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="e.g. Daily AI industry news roundup"
            disabled={mode === "drafts"}
            className="flex-1 bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={generating || !aiTopic.trim() || mode === "drafts"}
            className="bg-gray-100 text-gray-700 px-5 py-4 rounded-2xl hover:bg-gray-200 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all"
          >
            {generating ? "Generating..." : "AI Generate"}
          </button>
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          {mode === "drafts"
            ? "Not needed — existing drafts will be used as content"
            : "Describe the topic and let AI create a template for you. Or write your own template below."}
        </p>
      </div>

      {mode === "template" && (
        <div className="space-y-3">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
            Content Template
          </label>
          <textarea
            value={contentTemplate}
            onChange={(e) => setContentTemplate(e.target.value)}
            required={mode === "template"}
            rows={4}
            className="w-full bg-gray-50 border-gray-100 rounded-3xl p-5 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300"
          />
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
            The post template. Use <code className="text-gray-600">{`{date}`}</code> for today's date and <code className="text-gray-600">{`{time}`}</code> for the current time. These will be replaced automatically when the post is created.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-8 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-gray-600 text-white px-8 py-4 rounded-2xl hover:bg-gray-700 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-3"
        >
          {saving ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Scheduling...</>
          ) : initial ? "Save Changes" : "Create Schedule"}
        </button>
        <Link href="/schedules" className="flex-1 bg-white border border-gray-200 text-gray-400 px-8 py-4 rounded-2xl hover:bg-gray-50 hover:text-gray-700 text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center">
          Cancel
        </Link>
      </div>
    </form>
  );
}
