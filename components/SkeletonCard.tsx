export function PostCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 rounded-full w-16" />
            <div className="h-5 bg-gray-200 rounded w-24" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-8 bg-gray-200 rounded w-14" />
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export function SourceCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-12 bg-gray-50 rounded w-full" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-8 bg-gray-200 rounded w-14" />
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export function ScheduleCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-36" />
          <div className="h-3 bg-gray-200 rounded w-48" />
          <div className="h-3 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-56" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-8 bg-gray-200 rounded w-14" />
          <div className="h-8 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-100 bg-[#F9FAFB]/50">
        <div className="h-4 bg-gray-200 rounded w-40" />
      </div>
      <div className="p-6 h-[300px] flex items-center justify-center">
        <div className="w-full h-full bg-gray-50 rounded-lg" />
      </div>
    </div>
  );
}
