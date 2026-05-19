"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api-client";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/lib/auth-context";
import { useConfirm } from "@/components/ConfirmModal";
import { Users, Plus, Trash2, Key } from "lucide-react";

interface User {
  _id: string;
  username: string;
  role: "admin" | "user";
  createdAt: string;
}

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: string; username: string } | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const fetchUsers = () => {
    api.get<User[]>("/users")
      .then(setUsers)
      .catch((e) => console.error("Failed to load users:", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/users", { username: newUsername, password: newPassword, role: newRole });
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
      setShowCreate(false);
      fetchUsers();
    } catch (e: any) {
      setError(e.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!await confirm({ title: "Delete User", message: `Delete user "${username}"? This cannot be undone.`, variant: "danger" })) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (e: any) {
      console.error(e.message || "Failed to delete user");
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetError("");
    if (resetPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    try {
      await api.put(`/users/${resetTarget.id}/reset-password`, { password: resetPassword });
      setResetTarget(null);
      setResetPassword("");
      setResetError("");
    } catch (e: any) {
      setResetError(e.message || "Failed to reset password");
    }
  };

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <PageContainer title="Users" breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Users" }]}>
          <div className="text-center py-20 text-gray-500 font-medium">Admin access required</div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer
        title="User Management"
        description="Create, manage, and remove user accounts."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Users" }]}
      >
        <div className="max-w-3xl">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-gray-900 p-2.5 rounded-xl">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">All Users ({users.length})</h3>
                  <p className="text-sm text-gray-500">Manage accounts and permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-1.5 bg-gray-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-gray-800 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add User
              </button>
            </div>

            {showCreate && (
              <form onSubmit={handleCreate} className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Username</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium bg-white"
                      required
                      minLength={3}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium bg-white"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium bg-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                {error && <p className="text-xs font-bold text-red-600">{error}</p>}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gray-900 text-white rounded-xl px-5 py-2 text-xs font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-black text-gray-600">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          {u.username}
                          {u.role === "admin" && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-gray-900 text-white px-2 py-0.5 rounded">Admin</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          Created {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setResetTarget({ id: u._id, username: u.username })}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                        title="Reset password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id, u.username)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {resetTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setResetTarget(null); setResetPassword(""); setResetError(""); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div>
                <h3 className="text-lg font-black text-gray-900">Reset Password</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">New password for <span className="text-gray-700">{resetTarget.username}</span></p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">New Password</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => { setResetPassword(e.target.value); setResetError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleResetPassword(); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium bg-white"
                  autoFocus
                  minLength={6}
                  placeholder="At least 6 characters"
                />
                {resetError && <p className="text-xs font-bold text-red-600 mt-2">{resetError}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setResetTarget(null); setResetPassword(""); setResetError(""); }}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-gray-800 transition-all"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </ProtectedRoute>
  );
}
