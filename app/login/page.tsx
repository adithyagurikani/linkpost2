"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      await login(
        formData.get("username") as string,
        formData.get("password") as string
      );
      router.push("/dashboard");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "We couldn't find an account with those credentials.");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f4f4f5] font-sans overflow-hidden selection:bg-black selection:text-white">
      
      {/* Left Side - Form Container */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 md:px-16 lg:px-20 relative z-10 bg-white border-r border-gray-200/50 shadow-2xl">
         
         {/* Brand Header */}
         <div className="absolute top-10 left-8 md:left-16 lg:left-20 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-black text-white w-7 h-7 rounded flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
                ip
              </div>
              <span className="text-lg font-black tracking-tight text-black">inkpost</span>
            </Link>
         </div>

         <div className="max-w-sm w-full mx-auto lg:mx-0 mt-16 lg:mt-0">
            <div className="mb-10 text-left">
               <h1 className="text-3xl font-black text-black tracking-tighter mb-2 leading-tight">Welcome back.</h1>
               <p className="text-gray-400 font-medium text-sm">Enter your credentials to access the automation hub.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-reveal-up">
                 <div className="mt-0.5 bg-red-500 rounded-full p-0.5">
                   <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                 </div>
                 <p className="text-xs font-bold text-red-700 leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
               <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-xs font-black uppercase tracking-wider text-gray-400">
                     Username or Email
                  </label>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                        <Mail className="w-4 h-4" />
                     </div>
                     <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        placeholder="Enter your username"
                        className="block w-full pl-10 pr-4 py-3 bg-[#f4f4f5] border border-gray-200/60 rounded-xl text-black placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-black focus:border-black transition-all outline-none font-semibold text-sm shadow-sm"
                     />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                     <label htmlFor="password" className="block text-xs font-black uppercase tracking-wider text-gray-400">
                        Password
                     </label>
                  </div>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                        <Lock className="w-4 h-4" />
                     </div>
                     <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-4 py-3 bg-[#f4f4f5] border border-gray-200/60 rounded-xl text-black placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-black focus:border-black transition-all outline-none font-semibold text-sm shadow-sm"
                     />
                  </div>
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold text-sm py-3.5 px-4 rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed group mt-8 active:scale-[0.98] overflow-hidden relative"
               >
                  <div className="absolute inset-0 bg-white/20 w-1/2 -translate-x-full group-hover:animate-[sweep-shine_1s_ease-in-out_forwards]"></div>
                  {loading ? (
                    <>
                       <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                       Sign in to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
               </button>
            </form>

            <div className="mt-8 text-center">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  New to Inkpost?{" "}
                  <Link href="/register" className="text-black underline font-black hover:text-gray-600 transition-colors">
                     Request Access
                  </Link>
               </p>
            </div>
         </div>
         
         {/* Static Footer Note */}
         <div className="absolute bottom-8 left-0 w-full text-center lg:text-left lg:px-20 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
             © 2026 Inkpost Platform. Verified Secure Protocol active.
         </div>
      </div>

      {/* Right Side - Visual Experience (Monochromatic Bento Style) */}
      <div className="hidden lg:flex flex-1 bg-[#f4f4f5] relative flex-col items-center justify-center px-16 overflow-hidden z-0">
         {/* Dynamic Grid Background Overlay */}
         <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70 pointer-events-none"></div>

         <div className="max-w-lg relative text-center z-10 perspective-container">
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-2xl hover-3d text-left animate-float-soft relative overflow-hidden">
               <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl -z-10"></div>
               
               <div className="flex items-center gap-1.5 mb-6">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
               </div>
               
               <div className="inline-flex items-center gap-2 bg-[#f4f4f5] border border-gray-200 text-black text-[10px] font-black uppercase tracking-wider py-1.5 px-4 rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5" /> High Performance Automation
               </div>

               <h2 className="text-3xl font-black text-black leading-[1.1] tracking-tight mb-4">
                  Decoupled Strategy.<br/>Continuous Visibility.
               </h2>

               <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed">
                 Inkpost aggregates schedules, performs real-time checks, and coordinates social execution with 100% compliant API integration routines.
               </p>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#f4f4f5] border border-gray-200/50 rounded-2xl p-4 flex items-center gap-3">
                   <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                   <div>
                     <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Performance</span>
                     <strong className="text-xs font-black text-black">under 3 seconds</strong>
                   </div>
                 </div>

                 <div className="bg-[#f4f4f5] border border-gray-200/50 rounded-2xl p-4 flex items-center gap-3">
                   <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                   <div>
                     <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">OpenCode AI</span>
                     <strong className="text-xs font-black text-black">Self-Healing Failover</strong>
                   </div>
                 </div>
               </div>
            </div>
         </div>
      </div>
   </div>
  );
}
