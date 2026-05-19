"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import api from "@/lib/api-client";

export default function SourceForm({
  initial,
}: {
  initial?: {
    id: string;
    name: string;
    sourceType: string;
    content: string;
  };
}) {
  const [name, setName] = useState(initial?.name || "");
  const [sourceType, setSourceType] = useState(initial?.sourceType || "text");
  const [content, setContent] = useState(initial?.content || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (initial) {
        await api.put(`/sources/${initial.id}`, { name, sourceType, content });
      } else {
        await api.post("/sources", { name, sourceType, content });
      }
      router.push("/sources");
    } catch (err: any) {
      toast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4 sm:p-8 max-w-3xl space-y-8 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
            Source Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300"
            placeholder="e.g. Q4 Marketing Ideas"
          />
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">A short, recognizable name for this content source</p>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
            Source Type
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all appearance-none"
          >
            <option value="text">Text (one item per line)</option>
            <option value="csv">CSV (comma-separated values)</option>
            <option value="json">JSON (structured data)</option>
          </select>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Choose the format that matches your content</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={12}
          className="w-full bg-gray-50 border-gray-100 rounded-3xl p-5 sm:p-7 text-sm font-bold placeholder-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all shadow-inner font-mono leading-relaxed"
          placeholder="Paste your source content here..."
        />
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">The actual content — one item per line, CSV rows, or JSON array</p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-8 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-gray-600 text-white px-8 py-4 rounded-2xl hover:bg-gray-700 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-3"
        >
          {saving ? (
             <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
          ) : <>Update Source</>}
        </button>
        <Link href="/sources" className="flex-1 bg-white border border-gray-200 text-gray-400 px-8 py-4 rounded-2xl hover:bg-gray-50 hover:text-gray-700 text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center">
          Cancel
        </Link>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1 col-span-full text-center">All sources can be edited or deleted later from the sources list</p>
      </div>
    </form>
  );
}
