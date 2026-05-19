"use client";
import api from "@/lib/api-client";
import { detectTimezone } from "@/lib/schedule-utils";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import SourceCard from "@/components/SourceCard";
import PageContainer from "@/components/PageContainer";
import { Plus, DownloadCloud, FileUp, Calendar } from "lucide-react";
import { useConfirm } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

interface Source {
  id: string;
  name: string;
  sourceType: string;
  content: string;
  isActive: boolean;
}

interface Account {
  id: string;
  name: string;
}

export default function SourcesClient({
  sources: initial,
  accounts,
}: {
  sources: Source[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importAllResult, setImportAllResult] = useState<{
    imported: number;
    skipped: number;
    failedSources?: number;
  } | null>(null);
  const [importingAll, setImportingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<{
    scheduled: number;
    daysScheduled: number;
    duplicatesRemoved?: number;
  } | null>(null);
  const [accountId, setAccountId] = useState(accounts && accounts.length > 0 ? accounts[0].id : "");
  const [startDate, setStartDate] = useState("");
  const [times, setTimes] = useState<string[]>(["09:00", "13:00", "17:00"]);
  const [postsPerDay, setPostsPerDay] = useState(3);
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const handleImport = useCallback(async (id: string) => {
    if (!await confirm({ title: "Import Posts", message: "Import posts from this source?", confirmLabel: "Import", variant: "primary" })) return;
    setImportingId(id);
    try {
      await api.post(`/sources/${id}/import`);
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Import failed.", "error");
    } finally {
      setImportingId(null);
    }
  }, [confirm, router]);

  const handleImportAll = useCallback(async () => {
    if (!await confirm({ title: "Import All Sources", message: "Import all sources? Duplicate content will be skipped.", confirmLabel: "Import All", variant: "primary" })) return;
    setImportingAll(true);
    setImportAllResult(null);
    try {
      const data = await api.post<any>("/sources/import-all");
      setImportAllResult({
        imported: data.imported,
        skipped: data.skipped,
        failedSources: data.failedSources,
      });
    } catch (err: any) {
      toast(err.message || "Import failed.", "error");
    } finally {
      setImportingAll(false);
      router.refresh();
    }
  }, [confirm, router]);

  const addTime = () => setTimes((prev) => [...prev, "12:00"]);
  const removeTime = (idx: number) => setTimes((prev) => prev.filter((_, i) => i !== idx));
  const updateTime = (idx: number, val: string) =>
    setTimes((prev) => prev.map((t, i) => (i === idx ? val : t)));

  const handleScheduleDrafts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !startDate) return;
    setScheduling(true);
    setScheduleResult(null);
    try {
      const data = await api.post<any>("/posts/schedule-drafts", { 
        accountId, startDate, times, postsPerDay, timezone: detectTimezone(),
      });
      setScheduleResult({
        scheduled: data.scheduled,
        daysScheduled: data.daysScheduled,
        duplicatesRemoved: data.duplicatesRemoved,
      });
      setShowScheduleForm(false);
    } catch (err: any) {
      toast(err.message || "Failed to schedule.", "error");
    } finally {
      setScheduling(false);
      router.refresh();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const rawPosts = JSON.parse(text);
      
      if (!Array.isArray(rawPosts)) {
        toast("Invalid JSON format. Needs to be an array of objects with content field.", "error");
        return;
      }

      const processedItems = rawPosts.map((raw: any, index: number) => {
        const content = raw.content || "";
        const lowerText = content.toLowerCase();
        let category = "General Topic";

        if (lowerText.includes("aws") || lowerText.includes("cloud") || lowerText.includes("vpc") || lowerText.includes("s3")) {
          category = "Cloud For Beginners";
        } else if (lowerText.includes("fastapi")) {
          category = "FastAPI Backend Tips";
        } else if (lowerText.includes("react") || lowerText.includes("hooks") || lowerText.includes("javascript")) {
          category = "React Development";
        } else if (lowerText.includes("python")) {
          category = "Python For Beginners";
        }

        const lines = content.split("\n").filter((l: string) => l.trim().length > 5);
        const firstLine = lines[0]?.replace(/[#*\[\]]/g, "").substring(0, 40) || `Entry #${index + 1}`;

        return {
          name: `[${category}] ${firstLine.trim()}`,
          content: content
        };
      });

      if (!await confirm({ title: "Bulk Import", message: `Found ${processedItems.length} entries. Proceed with bulk import?`, confirmLabel: "Import" })) {
        setIsProcessing(false);
        return;
      }

      const data = await api.post<any>("/sources/bulk-import", { items: processedItems });

      toast(`Successfully imported ${data.count} refined posts!`, "success");
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Failed to parse JSON. Check file format.", "error");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const headerActions = (
    <>
      <input 
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileUpload}
      />
      <button
        onClick={handleImportAll}
        disabled={importingAll}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
      >
        <FileUp className="w-4 h-4" /> {importingAll ? "Importing..." : "Import All"}
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
      >
        <DownloadCloud className="w-4 h-4" /> {isProcessing ? "Uploading..." : "Bulk Import JSON"}
      </button>
      <Link
        href="/sources/new"
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-500/20"
      >
        <Plus className="w-4 h-4" /> New Entry
      </Link>
    </>
  );

  return (
    <PageContainer
      title="Content Sources"
      description="Manage your source content — blog posts, notes, and ideas you can import as LinkedIn posts."
      breadcrumbs={[{ label: "Sources" }]}
      actions={headerActions}
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4 sm:p-8">
        {importAllResult && (
          <div className="mb-6 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="bg-emerald-500 text-white p-2 rounded-xl"><FileUp className="w-5 h-5"/></div>
                 <div>
                     <p className="text-xs font-black uppercase tracking-widest leading-none">Import Complete</p>
                     <p className="text-[10px] font-bold opacity-70 mt-1">
                       {importAllResult.imported} Imported • {importAllResult.skipped} Skipped
                     </p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowScheduleForm(true)}
                    className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Schedule Posts
                </button>
                <button
                  onClick={() => setImportAllResult(null)}
                  className="p-2.5 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {scheduleResult && (
          <div className="mb-6 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="bg-gray-600 text-white p-2 rounded-xl"><Calendar className="w-5 h-5"/></div>
                 <div>
                     <p className="text-xs font-black uppercase tracking-widest leading-none">Posts Scheduled</p>
                     <p className="text-[10px] font-bold opacity-70 mt-1">
                       {scheduleResult.scheduled} Posts • {scheduleResult.daysScheduled} Days
                     </p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/posts?status=scheduled"
                    className="flex-1 sm:flex-none bg-gray-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 flex items-center justify-center gap-2 transition-all shadow-lg shadow-gray-100"
                  >
                    View Scheduled Posts
                </Link>
                <button
                  onClick={() => setScheduleResult(null)}
                  className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {showScheduleForm && (
          <div className="mb-8 p-6 sm:p-8 bg-gray-50 border border-gray-100 rounded-3xl animate-slide-up">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="font-black text-gray-900 text-lg sm:text-xl uppercase tracking-tight">Schedule Drafts</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Set up posting times for your drafts across multiple days</p>
               </div>
               <button onClick={() => setShowScheduleForm(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <form onSubmit={handleScheduleDrafts} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    className="w-full bg-white border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold shadow-sm focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all appearance-none"
                  >
                    <option value="">Select account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-white border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold shadow-sm focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Posting Times (HH:MM)</label>
                   <button type="button" onClick={addTime} className="text-[10px] font-black text-gray-600 hover:text-gray-700 uppercase tracking-widest transition-colors">+ Add Time</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {times.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <input
                        type="time"
                        value={t}
                        onChange={(e) => updateTime(i, e.target.value)}
                        required
                        className="flex-1 bg-white border-gray-100 rounded-2xl py-3 px-5 text-sm font-bold shadow-sm focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all"
                      />
                      {times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTime(i)}
                          className="bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Post Frequency</label>
                  <div className="grid grid-cols-5 gap-2">
                     {[1, 2, 3, 4, 5].map((n) => (
                        <button
                           key={n}
                           type="button"
                           onClick={() => setPostsPerDay(n)}
                           className={`py-3 rounded-2xl text-xs font-black transition-all ${postsPerDay === n ? "bg-gray-600 text-white shadow-lg shadow-gray-100" : "bg-white text-gray-400 hover:bg-gray-100"}`}
                        >
                           {n}
                        </button>
                     ))}
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={scheduling || !accountId || !startDate}
                  className="bg-gray-600 text-white w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-700 disabled:opacity-50 transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-3"
                >
                  {scheduling ? (
                     <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Scheduling...</>
                   ) : "Schedule Posts"}
                </button>
              </div>
            </form>
          </div>
        )}

        {initial.length === 0 ? (
          <div className="py-24 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
             <div className="bg-white w-20 h-20 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
               <DownloadCloud className="w-10 h-10 text-gray-200" />
             </div>
             <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">No Sources Yet</h4>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-8">No content sources found — create or import one to get started</p>
             <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2.5 bg-white border border-gray-200 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                <FileUp className="w-4 h-4" /> Bulk Import
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initial.map((s) => (
              <SourceCard
                key={s.id}
                source={s}
                onDelete={() => router.refresh()}
                onImport={() => handleImport(s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
