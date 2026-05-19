"use client";
import api from "@/lib/api-client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConfirm } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";
import { Sparkles, Search, Hash, Save, Rocket, Loader2, Wand2 } from "lucide-react";

interface Account {
  id: string;
  name: string;
}

export default function PostForm({
  accounts,
  initial,
}: {
  accounts: Account[];
  initial?: {
    id: string;
    content: string;
    accountId: string | null;
    status: string;
    scheduledAt: string | null;
  };
}) {
  const [content, setContent] = useState(initial?.content || "");
  // Auto-select: if editing, use that account. If new, select ALL accounts by default.
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initial?.accountId
      ? [initial.accountId]
      : accounts.map((a) => a.id)
  );
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduledAt ? initial.scheduledAt.slice(0, 16) : ""
  );
  const [status, setStatus] = useState(initial?.status || "draft");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const router = useRouter();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(accounts.map((a) => a.id));
  const deselectAll = () => setSelectedIds([]);

  const handleAI = async (mode: string) => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const data = await api.post<any>("/ai/generate", { prompt: content, mode });
      if (data.response) {
        if (mode === "hashtags") {
          const tags = data.response.match(/#[a-zA-Z0-9_]+/g) || [];
          setSuggestedHashtags(tags);
        } else {
          setContent(data.response.trim());
        }
      }
    } catch (err: any) {
      toast(err.message || "AI generation failed", "error");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const appendHashtag = (tag: string) => {
    const separator = content.trim().endsWith(tag) ? "" : " ";
    setContent((prev) => `${prev.trim()}${separator}${tag} `);
    setSuggestedHashtags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const isEdit = !!initial;
    const url = isEdit ? `/posts/${initial.id}` : "/posts";
    const scheduledIso = scheduledAt ? new Date(scheduledAt).toISOString() : null;

    const body: Record<string, unknown> = { content };
    if (isEdit) {
      body.accountId = selectedIds[0] || null;
      body.status = status;
      body.scheduledAt = scheduledIso;
    } else {
      body.accountIds = selectedIds;
      body.scheduledAt = scheduledIso;
    }

    try {
      if (isEdit) {
        await api.put(url, body);
      } else {
        await api.post(url, body);
      }
      router.push("/posts");
    } catch (err: any) {
      toast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!content.trim()) return;
    if (selectedIds.length === 0) {
      toast("Select at least one account to publish to.", "error");
      return;
    }
    if (!await confirm({ title: "Publish Now", message: `Publish to ${selectedIds.length} account(s) on LinkedIn right now?`, confirmLabel: "Publish", variant: "primary" })) return;

    setPublishing(true);

    try {
      const isEdit = !!initial;

      if (isEdit) {
        // Save changes first
        await api.put(`/posts/${initial.id}`, {
          content,
          accountId: selectedIds[0] || null,
          status: "scheduled",
        });
        // Fire publish
        const pubData = await api.post<any>(`/posts/${initial.id}/post-now`);
        if (pubData.ok) {
          toast("Published successfully to LinkedIn!", "success");
        } else {
          toast(`Publishing failed: ${pubData.error || "Unknown error"}`, "error");
        }
      } else {
        // Create posts for all selected accounts
        const saved = await api.post<any>("/posts", {
          content,
          accountIds: selectedIds,
          scheduledAt: null,
        });

        if (saved.ids) {
          // Fire publish on each created post in parallel
          const results = await Promise.all(
            saved.ids.map((id: string) =>
              api.post<any>(`/posts/${id}/post-now`).catch(e => ({ ok: false, error: e.message }))
            )
          );
          const successes = results.filter((r: any) => r.ok).length;
          const failures = results.length - successes;
          if (failures === 0) {
            toast(`Published to ${successes} account(s) successfully!`, "success");
          } else {
            toast(`Published to ${successes} account(s). ${failures} failed.`, failures === 0 ? "success" : "error");
          }
        } else {
          toast("Failed to create posts.", "error");
        }
      }
    } catch (err: any) {
      toast(err.message || "An error occurred during publishing.", "error");
      console.error(err);
    }

    setPublishing(false);
    router.push("/posts");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4 sm:p-8 max-w-3xl space-y-8 animate-slide-up">
      {/* Content Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
             Post Content
           </label>
           <span className={`text-[10px] font-black uppercase tracking-widest ${content.length > 3000 ? "text-red-500" : "text-gray-400"}`}>
             {content.length} <span className="opacity-30">/</span> 3000
           </span>
        </div>
        
        <div className="relative group">
         <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 3000))}
              required
              rows={8}
              maxLength={3000}
              className="w-full bg-gray-50 border-gray-100 rounded-3xl p-5 sm:p-7 text-sm font-bold placeholder-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all shadow-inner leading-relaxed"
              placeholder="Write your LinkedIn post here..."
            />
           {content.length > 3000 && (
             <div className="absolute -bottom-2 right-4 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                Over 3000 chars — LinkedIn will truncate
             </div>
           )}
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          Write the content for your LinkedIn post. LinkedIn supports up to 3,000 characters.
        </p>

        {/* AI Writing Assistants */}
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1 pt-2">
          Use AI to help write, improve, or add hashtags to your post
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={aiLoading || !content.trim()}
            onClick={() => handleAI("refine")}
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-600 hover:text-white disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {aiLoading ? "Refining..." : <><Sparkles className="w-3.5 h-3.5" /> Refine with AI</>}
          </button>
          <button
            type="button"
            disabled={aiLoading || !content.trim()}
            onClick={() => handleAI("expand")}
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-600 hover:text-white disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {aiLoading ? "Expanding..." : <><Search className="w-3.5 h-3.5" /> Expand with AI</>}
          </button>
          <button
            type="button"
            disabled={aiLoading || !content.trim()}
            onClick={() => handleAI("hashtags")}
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl hover:bg-emerald-600 hover:text-white disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {aiLoading ? "Generating..." : <><Hash className="w-3.5 h-3.5" /> Generate Hashtags</>}
          </button>
        </div>

        {suggestedHashtags.length > 0 && (
          <div className="mt-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl animate-slide-up">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Suggested Hashtags — click to add to post</span>
            <div className="flex flex-wrap gap-2">
              {suggestedHashtags.map((tag, i) => (
                <button
                  key={`${tag}-${i}`}
                  type="button"
                  onClick={() => appendHashtag(tag)}
                  className="text-[10px] font-black uppercase tracking-widest bg-white border border-emerald-100 text-emerald-600 px-3 py-2 rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Post To (LinkedIn Accounts)
          </label>
          {accounts.length > 1 && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={selectAll}
                className="text-[10px] font-black text-gray-500 hover:text-gray-700 uppercase tracking-widest transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Deselect All
              </button>
            </div>
          )}
        </div>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1 -mt-2">
          Choose which LinkedIn account(s) to post to. Select multiple to broadcast the same post to all accounts.
        </p>
        {accounts.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">No LinkedIn accounts connected</p>
            <Link href="/accounts" className="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:underline">Connect an account first</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {accounts.map((a) => {
              const active = selectedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAccount(a.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 group text-left ${
                    active
                      ? "bg-gray-600 text-white border-gray-600 shadow-lg shadow-gray-100"
                      : "bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${active ? "bg-white/20 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-600"}`}>
                    {a.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black uppercase tracking-tight truncate leading-none mb-0.5">{a.name}</div>
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${active ? "text-gray-200" : "text-gray-300"}`}>{active ? "Selected" : "Click to select"}</div>
                  </div>
                  {active && (
                    <div className="bg-white/20 p-1 rounded-lg">
                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                       </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Schedule */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
            Schedule Date & Time
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all cursor-pointer"
          />
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Set a future date/time to schedule this post, or leave empty to save as a draft.</p>
        </div>

        {/* Status (edit mode only) */}
        {initial && (
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
              Post Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all appearance-none"
            >
              <option value="draft">Draft — Not yet scheduled</option>
              <option value="scheduled">Scheduled — Will post at the chosen time</option>
              <option value="queued">Queued — Ready in the publishing queue</option>
            </select>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Change the current status of this post. Scheduled posts are picked up by the cron job for publishing.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-8 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving || publishing}
          className="flex-1 bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-2xl hover:bg-gray-50 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {initial ? "Save Changes" : "Save as Draft"}</>}
        </button>

        <button
          type="button"
          disabled={saving || publishing || !content.trim() || selectedIds.length === 0}
          onClick={handlePublishNow}
          className="flex-1 bg-gray-600 text-white px-8 py-4 rounded-2xl hover:bg-gray-700 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-2"
        >
          {publishing ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Publishing...</>
          ) : (
            <><Rocket className="w-4 h-4" /> Publish to LinkedIn Now</>
          )}
        </button>
      </div>
      <p className="text-[9px] font-bold text-gray-500 text-center tracking-[0.15em] -mt-4">
        Save as draft to edit later, or publish immediately to LinkedIn
      </p>
    </form>
  );
}
