"use client";

import { memo } from "react";
import Link from "next/link";

interface PostCardProps {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  accountName: string | null;
  errorMessage: string | null;
  shareUrl: string | null;
  likes?: number;
  comments?: number;
  onDelete: () => void;
  onPostNow: () => void;
  onDuplicate?: () => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-50 text-gray-700",
  scheduled: "bg-gray-100 text-gray-800",
  queued: "bg-yellow-100 text-yellow-800",
  posting: "bg-gray-100 text-gray-800",
  posted: "bg-gray-200 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const PostCard = memo(function PostCard({
  id,
  content,
  status,
  scheduledAt,
  postedAt,
  accountName,
  errorMessage,
  shareUrl,
  likes = 0,
  comments = 0,
  onDelete,
  onPostNow,
  onDuplicate,
}: PostCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 hover-lift hover:border-gray-900 group">
      {/* Content Section */}
      <div className="flex flex-col gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-gray-900 line-clamp-3 font-medium leading-relaxed">
            {content}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusColors[status] || "bg-gray-50 text-gray-700"}`}
            >
              {status}
            </span>
            
            {accountName && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                {accountName}
              </div>
            )}
            
            {scheduledAt && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                {new Date(scheduledAt).toLocaleDateString()} at {new Date(scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            )}
            
            {postedAt && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-black">
                <span className="w-1 h-1 rounded-full bg-green-300"></span>
                {new Date(postedAt).toLocaleDateString()}
              </div>
            )}

            {(likes > 0 || comments > 0) && (
              <div className="flex gap-3 bg-gray-50 px-3 py-1 rounded-lg font-bold text-[10px] text-gray-900 border border-gray-200 uppercase tracking-tighter">
                <span className="flex items-center gap-1">👍 {likes}</span>
                <span className="flex items-center gap-1">💬 {comments}</span>
              </div>
            )}
          </div>

          {errorMessage && (
            <p className="mt-3 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
              Error: {errorMessage}
            </p>
          )}

          {shareUrl && (
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs font-bold text-black hover:underline inline-flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg transition-colors border border-gray-200/50"
            >
              View on LinkedIn <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>

        {/* Action buttons: Grid on mobile, flex on sm+ */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-4 border-t border-gray-50">
          <Link
            href={`/posts/${id}/edit`}
            className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100 hover-scale sm:w-auto"
          >
            Edit
          </Link>
          
          {onDuplicate && status !== "posted" && (
            <button
              onClick={onDuplicate}
              className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100 hover-scale sm:w-auto"
            >
              Duplicate
            </button>
          )}
          
          {(status === "failed") && (
            <button
              onClick={onPostNow}
              className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-100 transition-all sm:w-auto"
            >
              Retry
            </button>
          )}
          {(status === "draft" || status === "scheduled" || status === "queued") && (
            <button
              onClick={onPostNow}
              className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10 hover-scale sm:w-auto"
            >
              Push Now
            </button>
          )}
          
          <button
            onClick={onDelete}
            className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover-scale col-span-2 sm:col-auto sm:ml-auto"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

export default PostCard;
