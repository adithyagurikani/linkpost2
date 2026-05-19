"use client";

import PageContainer from "@/components/PageContainer";
import PlannerClient from "./PlannerClient";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SchedulePlannerPage() {
  return (
    <ProtectedRoute>
      <PageContainer
        title="Schedule Planner"
        description="Describe your scheduling needs in plain English and let AI create a plan."
        breadcrumbs={[{ label: "Schedule Planner" }]}
      >
        <div className="max-w-3xl">
          <PlannerClient />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
