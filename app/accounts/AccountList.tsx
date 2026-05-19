"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountCard from "@/components/AccountCard";

interface Account {
  id: string;
  name: string;
  linkedinUserId: string;
  avatarUrl: string | null;
  isActive: boolean;
  tokenExpiresAt?: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  linkedin_denied: "LinkedIn authorization was denied.",
  state_mismatch: "Security check failed. Please try again.",
  missing_params: "Missing authorization code from LinkedIn. Please try again.",
  invalid_scope: "LinkedIn rejected the requested permissions. The app may need additional products enabled in the LinkedIn Developer Portal.",
  access_denied: "You denied the authorization request.",
};

export default function AccountList({
  accounts: initial,
  connected,
  error,
}: {
  accounts: Account[];
  connected?: string;
  error?: string;
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (connected === "1") {
      setToast("LinkedIn account connected successfully!");
      setTimeout(() => { setToast(null); router.replace("/accounts"); }, 3000);
      return;
    }

    if (error) {
      const msg = ERROR_MESSAGES[error] || (error.startsWith("LinkedIn%20") || error.startsWith("LinkedIn ") ? decodeURIComponent(error) : `Error: ${error}`);
      setToast(msg);
      setTimeout(() => { setToast(null); router.replace("/accounts"); }, 6000);
    }
  }, [connected, error, router]);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`p-4 rounded-2xl text-xs font-black uppercase tracking-widest border animate-slide-up ${connected === "1" ? "bg-gray-100 text-gray-900 border-gray-300 shadow-lg shadow-green-100" : "bg-red-50 text-red-600 border-red-100 shadow-lg shadow-red-100"}`}>
          {toast}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initial.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onToggle={router.refresh}
            onDisconnect={router.refresh}
            onReconnect={router.refresh}
          />
        ))}
      </div>
    </div>
  );
}
