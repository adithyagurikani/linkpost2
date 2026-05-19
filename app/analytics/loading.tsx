import { StatsCardSkeleton, ChartSkeleton } from "@/components/SkeletonCard";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <header>
        <div className="h-8 bg-gray-200 rounded w-56 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-72 mt-2 animate-pulse" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton />
    </div>
  );
}
