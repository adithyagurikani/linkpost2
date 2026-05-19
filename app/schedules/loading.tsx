import { ScheduleCardSkeleton } from "@/components/SkeletonCard";

export default function SchedulesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-28 animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ScheduleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
