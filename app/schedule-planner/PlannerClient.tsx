"use client";
import api from "@/lib/api-client";
import { detectTimezone } from "@/lib/schedule-utils";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Sparkles, Calendar, Clock, Edit3, CheckCircle2, AlertTriangle
} from "lucide-react";

type PostSlot = {
  date: string;
  time: string;
  content: string;
  accountId: string;
};

type RecurringProposal = {
  name: string;
  contentTemplate: string;
  times: string[];
  accountId: string;
};

type Plan = {
  summary: string;
  posts: PostSlot[];
  recurringSchedule: RecurringProposal | null;
};

export default function PlannerClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ created: number; schedule?: string } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const generatePlan = async () => {
    const p = prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    setError("");
    setPlan(null);
    setResult(null);
    try {
      const data = await api.post<any>("/ai/schedule-plan", { prompt: p });
      if (!data.plan) throw new Error("No plan returned");
      setPlan(data.plan);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const updatePostContent = (index: number, content: string) => {
    if (!plan) return;
    const updated = { ...plan, posts: [...plan.posts] };
    updated.posts[index] = { ...updated.posts[index], content };
    setPlan(updated);
  };

  const executePlan = async () => {
    if (!plan) return;
    setExecuting(true);
    setError("");
    let createdCount = 0;
    let scheduleName: string | undefined;

    try {
      const timezone = detectTimezone();
      for (const post of plan.posts) {
        try {
          await api.post("/posts", {
            content: post.content,
            accountId: post.accountId || undefined,
            scheduledAt: `${post.date}T${post.time}:00`,
          });
          createdCount++;
        } catch (err) {
          console.error("Failed to create post in plan:", err);
        }
      }

      if (plan.recurringSchedule) {
        try {
          await api.post("/schedules", {
            name: plan.recurringSchedule.name,
            accountId: plan.recurringSchedule.accountId,
            times: plan.recurringSchedule.times,
            contentTemplate: plan.recurringSchedule.contentTemplate,
            timezone,
          });
          scheduleName = plan.recurringSchedule.name;
        } catch (err) {
          console.error("Failed to create recurring schedule:", err);
        }
      }

      setResult({ created: createdCount, schedule: scheduleName });
      router.refresh();
    } catch {
      setError("Failed to execute plan. Some posts may have been created.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-3 block">
          Describe Your Scheduling Needs
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generatePlan()}
            placeholder='e.g. "Schedule 20 posts for June to July, mix of AI content and my drafts"'
            className="flex-1 bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300"
            disabled={loading}
          />
          <button
            onClick={generatePlan}
            disabled={loading || !prompt.trim()}
            className="bg-gray-600 text-white px-5 py-4 rounded-2xl hover:bg-gray-700 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? "Planning..." : "Generate Plan"}
          </button>
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mt-3 ml-1">
          Describe your posting plan in plain English. The AI will create a schedule with specific posts, dates, and times.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Result summary */}
      {result && (
        <div className="bg-gray-100 border border-gray-300 text-gray-900 rounded-xl p-4 text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Plan executed!</strong> Created {result.created} scheduled post{result.created !== 1 ? "s" : ""}.
            {result.schedule && ` Created recurring schedule "${result.schedule}".`}
          </div>
        </div>
      )}

      {/* Plan display */}
      {plan && !executing && !result && (
        <>
          {/* Summary */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-800 leading-relaxed">
            {plan.summary}
          </div>

          {/* Recurring schedule proposal */}
          {plan.recurringSchedule && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-800">Recurring Schedule Proposed</h3>
              </div>
              <p className="text-xs text-amber-700 mb-1"><strong>Name:</strong> {plan.recurringSchedule.name}</p>
              <p className="text-xs text-amber-700 mb-1"><strong>Times:</strong> {plan.recurringSchedule.times.join(", ")}</p>
              <p className="text-xs text-amber-700"><strong>Template:</strong> {plan.recurringSchedule.contentTemplate}</p>
            </div>
          )}

          {/* Post slots */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Proposed Posts ({plan.posts.length})
            </h3>
            {plan.posts.map((post, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.time}
                  </span>
                </div>
                {editingIndex === i ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-gray-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updatePostContent(i, editContent);
                          setEditingIndex(null);
                        }}
                        className="text-xs font-medium text-gray-600 hover:text-gray-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">
                      {post.content}
                    </p>
                    <button
                      onClick={() => {
                        setEditingIndex(i);
                        setEditContent(post.content);
                      }}
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                      title="Edit content"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Confirm */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setPlan(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={executePlan}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Create
            </button>
          </div>
        </>
      )}

      {/* Executing */}
      {executing && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
          <span className="ml-3 text-gray-500 font-medium">Creating scheduled posts...</span>
        </div>
      )}
    </div>
  );
}
