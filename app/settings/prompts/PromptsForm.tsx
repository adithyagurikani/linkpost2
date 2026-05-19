"use client";
import api from "@/lib/api-client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GROUPS = [
  {
    label: "Hashtag Agent",
    roleKey: "hashtagSystemRole",
    instrKey: "hashtagInstruction",
    desc: "Used during publishing to auto-generate hashtags for posts without any.",
  },
  {
    label: "Content Refine Agent",
    roleKey: "refineSystemRole",
    instrKey: "refineInstruction",
    desc: "Used by 'Refine with AI' button in the post editor.",
  },
  {
    label: "Content Expand Agent",
    roleKey: "expandSystemRole",
    instrKey: "expandInstruction",
    desc: "Used by 'Search & Expand' button in the post editor.",
  },
  {
    label: "Batch Optimize Agent",
    roleKey: "batchSystemRole",
    instrKey: "batchInstruction",
    desc: "Used by cron to batch-generate hashtags for multiple posts at once.",
  },
  {
    label: "Pre-Publish Reviewer Agent",
    roleKey: "prePublishSystemRole",
    instrKey: "prePublishInstruction",
    desc: "Analyzes content before publishing. Must respond with PUBLISH or REJECT.",
  },
  {
    label: "Briefing Agent",
    roleKey: "briefSystemRole",
    instrKey: "briefInstruction",
    desc: "Provides AI-powered summaries of recent activity.",
  },
  {
    label: "Scheduling Agent",
    roleKey: "schedulerSystemRole",
    instrKey: "schedulerInstruction",
    desc: "Plans posting schedules from natural language requests.",
  },
];

export default function PromptsForm({
  prompts,
  defaults,
}: {
  prompts: Record<string, string>;
  defaults: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>({ ...prompts });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleReset = (key: string) => {
    setValues((prev) => ({ ...prev, [key]: defaults[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      await api.put("/settings/prompts", values);
      setMessage("Prompts saved successfully");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save prompts");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {GROUPS.map((group) => (
        <div key={group.roleKey} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">{group.label}</h3>
          </div>
          <p className="text-xs text-gray-500">{group.desc}</p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                System Role (agent identity)
              </label>
              <button
                type="button"
                onClick={() => handleReset(group.roleKey)}
                className="text-[10px] text-gray-400 hover:text-gray-600 underline"
              >
                Reset
              </button>
            </div>
            <textarea
              value={values[group.roleKey]}
              onChange={(e) => setValues((prev) => ({ ...prev, [group.roleKey]: e.target.value }))}
              rows={3}
              className="w-full rounded border border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                Task Instruction (what to do)
              </label>
              <button
                type="button"
                onClick={() => handleReset(group.instrKey)}
                className="text-[10px] text-gray-400 hover:text-gray-600 underline"
              >
                Reset
              </button>
            </div>
            <textarea
              value={values[group.instrKey]}
              onChange={(e) => setValues((prev) => ({ ...prev, [group.instrKey]: e.target.value }))}
              rows={2}
              className="w-full rounded border border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-3 py-2 text-xs font-mono"
            />
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-gray-900">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
      >
        {saving ? "Saving..." : "Save All Prompts"}
      </button>
    </form>
  );
}
