"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", { username, password });
      await login(username, password);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center px-4 font-sans selection:bg-black selection:text-white">
      <div className="w-full max-w-md animate-reveal-up">
        
        {/* Monochromatic Card Container */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-2xl p-8 relative overflow-hidden">
          
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <div className="bg-black text-white w-7 h-7 rounded flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                ip
              </div>
              <span className="text-base font-black tracking-tight text-black">inkpost</span>
            </Link>
            <h1 className="text-2xl font-black text-black tracking-tight leading-none">Create your account</h1>
            <p className="text-xs text-gray-400 font-medium mt-2">Get started with our premium automation tools.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
               <div className="mt-0.5 bg-red-500 rounded-full p-0.5">
                 <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
               </div>
               <p className="text-xs font-bold text-red-700 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#f4f4f5] border border-gray-200/60 rounded-xl p-3.5 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-black focus:border-black transition-all outline-none placeholder-gray-400 mt-1 shadow-sm"
                required
                minLength={3}
                placeholder="Choose a username"
              />
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider ml-1 mt-1">Must be at least 3 characters</p>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f4f4f5] border border-gray-200/60 rounded-xl p-3.5 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-black focus:border-black transition-all outline-none placeholder-gray-400 mt-1 shadow-sm"
                required
                minLength={6}
                placeholder="Create a password"
              />
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider ml-1 mt-1">At least 6 characters</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-[#f4f4f5] border border-gray-200/60 rounded-xl p-3.5 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-black focus:border-black transition-all outline-none placeholder-gray-400 mt-1 shadow-sm"
                required
                minLength={6}
                placeholder="Confirm your password"
              />
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider ml-1 mt-1">Type your password again</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold text-sm py-3.5 px-4 rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed group mt-8 active:scale-[0.98] overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 w-1/2 -translate-x-full group-hover:animate-[sweep-shine_1s_ease-in-out_forwards]"></div>
              {loading ? (
                <>
                   <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                   Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-wide mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-black underline font-black hover:text-gray-600 transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
