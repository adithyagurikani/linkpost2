"use client";

import { memo } from "react";
import Link from "next/link";
import api from "@/lib/api-client";
import { useConfirm } from "@/components/ConfirmModal";

interface Source {
  id: string;
  name: string;
  sourceType: string;
  content: string;
  isActive: boolean;
}

const SourceCard = memo(function SourceCard({
  source,
  onDelete,
  onImport,
}: {
  source: Source;
  onDelete: () => void;
  onImport: () => void;
}) {
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    if (!await confirm({ title: "Delete Source", message: "Delete this source?", variant: "danger" })) return;
    try {
      await api.delete(`/sources/${source.id}`);
      onDelete();
    } catch (err) {
      console.error("Delete source failed:", err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 hover:border-black transition-all group">
      <div className="flex flex-col gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
             <div className="font-bold text-gray-900 leading-tight">{source.name}</div>
             <div className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-900 border border-gray-200">
                {source.sourceType}
             </div>
          </div>
          <div className="relative mt-3">
             <div className="absolute inset-y-0 left-0 w-1 bg-gray-200 rounded-full"></div>
             <p className="pl-4 text-xs font-medium text-gray-500 italic line-clamp-2">
                {source.content.slice(0, 200)}
                {source.content.length > 200 ? "..." : ""}
             </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-4 border-t border-gray-50">
          <Link
            href={`/sources/${source.id}/edit`}
            className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all border border-gray-100 sm:w-auto"
          >
            Edit
          </Link>
          <button
            onClick={onImport}
            className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10 transition-all sm:w-auto"
          >
            Import
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all col-span-2 sm:col-auto sm:ml-auto"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

export default SourceCard;
