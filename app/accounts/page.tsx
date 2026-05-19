"use client";

import { useEffect, useState, Suspense } from "react";
import api from "@/lib/api-client";
import AccountList from "./AccountList";
import PageContainer from "@/components/PageContainer";
import { ArrowRight, Plus, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSearchParams } from "next/navigation";

function AccountsContent() {
  const [accounts, setAccounts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected") || undefined;
  const error = searchParams.get("error") || undefined;

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const data = await api.get<any[]>("/accounts");
        setAccounts(data);
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { authUrl } = await api.get<any>("/accounts/connect");
      window.location.href = authUrl;
    } catch (err) {
      console.error("Failed to get auth URL:", err);
      setConnecting(false);
    }
  };

  const headerActions = (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="bg-white/5 border border-white/10 hover:bg-white text-gray-300 hover:text-black px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
    >
      {connecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
      Connect LinkedIn
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <PageContainer
      title="LinkedIn Accounts"
      description="Manage your connected LinkedIn accounts for posting and publishing."
      breadcrumbs={[{ label: "Accounts" }]}
      actions={headerActions}
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {!accounts || accounts.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium mb-4">No LinkedIn accounts connected yet.</p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition-all shadow-lg shadow-gray-500/20 disabled:opacity-50"
            >
              {connecting ? "Redirecting..." : "Connect LinkedIn Account"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <AccountList accounts={accounts} connected={connected} error={error} />
        )}
      </div>
    </PageContainer>
  );
}

export default function AccountsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-gray-600" /></div>}>
        <AccountsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
