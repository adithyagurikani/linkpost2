"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/SkeletonCard";

const AreaChartLazy = dynamic(
  () => import("./charts/AreaChart"),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const BarChartLazy = dynamic(
  () => import("./charts/BarChart"),
  { loading: () => <ChartSkeleton />, ssr: false }
);

interface Props {
  chartData: any[];
}

export function EngagementTrajectory({ chartData }: Props) {
  return <AreaChartLazy data={chartData} />;
}

export function MetricDensity({ chartData }: Props) {
  return <BarChartLazy data={chartData} />;
}
