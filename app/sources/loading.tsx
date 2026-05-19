import { SourceCardSkeleton } from "@/components/SkeletonCard";

export default function SourcesLoading() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-36 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SourceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
