"use client";

import { useAuth } from "@/lib/auth-context";
import SettingsForm from "./SettingsForm";
import PageContainer from "@/components/PageContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer
        title="Account Settings"
        description="Update your password and manage your account."
        breadcrumbs={[{ label: "Settings" }]}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 max-w-2xl">
          <SettingsForm username={user?.username || "user"} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
