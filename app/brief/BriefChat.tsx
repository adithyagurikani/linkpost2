"use client";
import api from "@/lib/api-client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, MessageSquare } from "lucide-react";

type Entry = {
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "inkpost_brief_history";

function loadHistory(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: Entry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-50)));
  } catch {
    // ignore
  }
}

export default function BriefChat({ initialSummary }: { initialSummary?: string }) {
  const [entries, setEntries] = useState<Entry[]>(() => {
    const hist = loadHistory();
    if (initialSummary && hist.length === 0) {
      return [{ role: "assistant" as const, content: initialSummary }];
    }
    return hist;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  useEffect(() => {
    saveHistory(entries);
  }, [entries]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    const userEntry: Entry = { role: "user", content: q };
    setEntries((prev) => [...prev, userEntry]);
    setLoading(true);

    try {
      const data = await api.post<any>("/ai/brief", { query: q, days: 7 });
      const assistantEntry: Entry = { role: "assistant", content: data.summary };
      setEntries((prev) => [...prev, assistantEntry]);
    } catch {
      setEntries((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't fetch the briefing right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[70vh]">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">AI Brief</h2>
        </div>
        <button
          onClick={() => { setEntries([]); localStorage.removeItem(STORAGE_KEY); }}
          className="text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          Clear history
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <MessageSquare className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">Ask me anything about your InkPost activity</p>
            <p className="text-xs mt-1">e.g. "What failed yesterday?" or "How many posts this week?"</p>
          </div>
        )}
        {entries.map((entry, i) => (
          <div key={i} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                entry.role === "user"
                  ? "bg-gray-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {entry.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
              <span className="text-sm text-gray-500">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 sm:px-6 py-3 border-t border-gray-100">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your activity..."
              className="flex-1 bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-gray-600 text-white rounded-2xl p-4 hover:bg-gray-700 disabled:opacity-40 transition-all shadow-lg shadow-gray-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] px-1">
            Ask about your posting activity — e.g. &ldquo;What failed yesterday?&rdquo; or &ldquo;How many posts this week?&rdquo; Press Enter to send.
          </p>
        </div>
      </div>
    </div>
  );
}
