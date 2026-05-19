"use client";

import { memo, useState } from "react";
import api from "@/lib/api-client";
import { useConfirm } from "@/components/ConfirmModal";

interface Account {
  id: string;
  name: string;
  linkedinUserId: string;
  avatarUrl: string | null;
  isActive: boolean;
  tokenExpiresAt?: string | null;
}

const AccountCard = memo(function AccountCard({
  account,
  onToggle,
  onDisconnect,
  onReconnect,
}: {
  account: Account;
  onToggle: () => void;
  onDisconnect: () => void;
  onReconnect?: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.post(`/accounts/${account.id}/toggle`);
    } catch (err) {
      console.error("Failed to toggle account:", err);
    } finally {
      setToggling(false);
      onToggle();
    }
  };

  const { confirm } = useConfirm();

  const handleDisconnect = async () => {
    if (!await confirm({ title: "Disconnect Account", message: "Disconnect this LinkedIn account?", confirmLabel: "Disconnect", variant: "danger" })) return;
    setDisconnecting(true);
    try {
      await api.post(`/accounts/${account.id}/disconnect`);
    } catch (err) {
      console.error("Failed to disconnect account:", err);
    } finally {
      setDisconnecting(false);
      onDisconnect();
    }
  };

  const handleReconnect = async () => {
    try {
      const data = await api.post<{ authUrl: string }>("/accounts/connect");
      if (onReconnect) onReconnect();
      window.location.href = data.authUrl;
    } catch (err) {
      console.error("Failed to reconnect account:", err);
    }
  };

  const isExpired = (() => {
    if (!account.tokenExpiresAt) return false;
    const expiry = new Date(account.tokenExpiresAt).getTime();
    return Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)) <= 0;
  })();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 hover:border-black transition-all group">
      <div className="flex items-center gap-4 mb-5">
        {account.avatarUrl ? (
          <img
            src={account.avatarUrl}
            alt={account.name}
            className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-sm border border-gray-100"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 font-bold text-xl shrink-0">
            {account.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-gray-900 truncate leading-tight">{account.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${account.isActive ? "bg-gray-100 text-gray-900 border border-gray-300" : "bg-gray-50 text-gray-400 border border-gray-100"}`}>
              {account.isActive ? "Online" : "Paused"}
            </span>
            {account.tokenExpiresAt && (() => {
              const expiry = new Date(account.tokenExpiresAt).getTime();
              const diffDays = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
              if (diffDays <= 14) {
                return (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${diffDays <= 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                    {diffDays <= 0 ? "Expired" : `${diffDays}D LEFT`}
                  </span>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
      
      <div className={`grid ${isExpired ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border disabled:opacity-50 ${account.isActive ? "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100" : "bg-black text-white border-black hover:bg-gray-800 shadow-md shadow-black/5"}`}
        >
          {account.isActive ? "Pause" : "Resume"}
        </button>
        {isExpired && (
          <button
            onClick={handleReconnect}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-gray-600 text-white border border-gray-600 hover:bg-gray-700 transition-all shadow-md shadow-gray-100"
          >
            Reconnect
          </button>
        )}
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 transition-all"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
});

export default AccountCard;
