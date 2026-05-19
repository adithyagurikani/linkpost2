"use client";
import api from "@/lib/api-client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ username }: { username: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      await api.put("/settings/password", { currentPassword, newPassword });
      setMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4 sm:p-8 space-y-8 animate-slide-up">
      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Username</label>
        <input
          value={username}
          disabled
          className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner text-gray-400"
        />
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          Your account username. This cannot be changed.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          placeholder="Enter your current password"
          className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300"
        />
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          Enter your existing password to authorize the change
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          placeholder="At least 6 characters"
          className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300"
        />
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          Choose a new password — minimum 6 characters
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Re-enter your new password"
          className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-500/10 focus:border-gray-500 transition-all placeholder-gray-300"
        />
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">
          Type the new password again to confirm it matches
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl text-sm font-bold">{error}</div>
      )}
      {message && (
        <div className="bg-gray-100 border border-gray-300 text-gray-900 px-5 py-4 rounded-2xl text-sm font-bold">{message}</div>
      )}

      <div className="pt-8 border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto bg-gray-600 text-white px-8 py-4 rounded-2xl hover:bg-gray-700 disabled:opacity-40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-3"
        >
          {saving ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Updating...</>
          ) : <>🔑 Update Password</>}
        </button>
      </div>
    </form>
  );
}
