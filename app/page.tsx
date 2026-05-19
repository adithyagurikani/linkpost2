"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  PenLine, Sparkles, FolderSync, Share2, Search,
  CheckCircle2, Laptop, Smartphone, ShieldCheck, ChevronRight,
  TrendingUp, Calendar, Zap, Layers, RefreshCw, BarChart3, Users
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="bg-[#f4f4f5] min-h-screen font-sans overflow-x-hidden text-gray-900 selection:bg-black selection:text-white">
      
      {/* ────────── MINIMALIST NAVIGATION ────────── */}
      <header className="sticky top-0 z-50 bg-[#f4f4f5]/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-black text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
              ip
            </div>
            <span className="font-extrabold text-base tracking-tight text-black">
              InkPost
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Product</Link>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-sm font-bold text-black hover:text-gray-600 transition-colors">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-black transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="bg-black text-white text-xs font-bold px-4 py-2.5 rounded-full hover:bg-gray-800 hover-scale shadow-md">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ────────── MOTION HERO SECTION ────────── */}
      <section className="relative pt-24 pb-20 px-6 max-w-5xl mx-auto text-center perspective-container">
        


        {/* Massive Typography */}
        <h1 className="text-5xl md:text-8xl font-black text-black tracking-tighter leading-[0.95] mb-6 animate-reveal-up delay-100">
          Automate LinkedIn,<br />
          <span className="text-black">maximize influence</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 font-semibold leading-relaxed mb-10 animate-reveal-up delay-200">
          Schedule, generate, and publish LinkedIn content across multiple accounts with AI-powered automation. Post 3x daily without lifting a finger.
        </p>

        {/* Hero Actions */}
        <div className="flex items-center justify-center gap-4 animate-reveal-up delay-300">
          <Link href={isLoggedIn ? "/dashboard" : "/register"} className="bg-black text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-gray-800 hover-scale shadow-xl shadow-black/10 flex items-center gap-2 group overflow-hidden relative">
            <div className="absolute inset-0 bg-white/20 w-1/2 -translate-x-full shine-effect"></div>
            Get Started Free <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="#features" className="bg-white text-black border border-gray-200 text-sm font-bold px-6 py-3 rounded-full hover:bg-gray-50 hover-scale flex items-center gap-2">
            See how it works
          </Link>
        </div>

        {/* ────────── INTERACTIVE FLOATING MOCKUP ────────── */}
        <div className="mt-20 relative animate-reveal-up delay-500 hover-lift mx-auto max-w-4xl">
          {/* Decorative graphic backdrop */}
          <div className="absolute -bottom-20 -inset-x-20 h-64 bg-gradient-to-t from-[#f4f4f5] via-[#f4f4f5]/80 to-transparent z-10 pointer-events-none"></div>
          
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden relative z-0 animate-float-soft">
            {/* Mockup Header */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3.5 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-200"></span>
                <span className="w-3 h-3 rounded-full bg-gray-200"></span>
                <span className="w-3 h-3 rounded-full bg-gray-200"></span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400">Post Schedule</span>
                <div className="w-px h-3 bg-gray-200 mx-1"></div>
                <strong className="text-[10px] font-black text-black">Active</strong>
              </div>
              <div className="w-16"></div>
            </div>

            {/* Mockup Body */}
            <div className="p-8 md:p-12 text-left relative">
              <div className="inline-flex items-center gap-2 bg-[#f4f4f5] border border-gray-200/50 rounded-xl px-3 py-1.5 text-[10px] font-black text-black uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5" /> AI Draft Model v1.2
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-black mb-4 tracking-tight leading-none">Scaling content generation is finally standardized.</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4">
                Writing top-performing LinkedIn thoughts is simple when you combine your core ideas with AI templates. 
                <span className="bg-gray-100 text-black px-1.5 py-0.5 rounded mx-1 font-bold">100% automated queue routing</span>
                dispatches updates precisely when your network is online.
              </p>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                Connect your LinkedIn profiles, add scheduled timeframes, copy paste raw notes, and watch your engagement metrics skyrocket automatically.
              </p>
              
              {/* Floating AI Button inside mockup */}
              <div className="absolute bottom-6 right-6 pointer-events-none">
                <div className="bg-black text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg animate-float-intense opacity-60">
                  <Sparkles className="w-3.5 h-3.5 text-white" /> Optimize Post
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Ticker Strip */}
        <div className="mt-28 pt-8 border-t border-gray-200/60 overflow-hidden relative animate-reveal-up delay-700">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#f4f4f5] to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#f4f4f5] to-transparent z-10"></div>
          <div className="flex gap-12 animate-marquee items-center opacity-60">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-12 items-center">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest"><ShieldCheck className="w-4 h-4"/> Multi-Account Broadcasting</span>
                <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest"><FolderSync className="w-4 h-4"/> 3x Daily Auto-Cron Pipeline</span>
                <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest"><CheckCircle2 className="w-4 h-4"/> Dynamic Tag Injection</span>
                <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest"><Share2 className="w-4 h-4"/> Engagement Analytics Sync</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── BENTO GRID FEATURES ────────── */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto scroll-mt-16">
        <div className="mb-16 text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight mb-4 leading-none">Everything you need <br/>to grow on LinkedIn.</h2>
          <p className="text-gray-500 font-medium text-lg max-w-xl">
            From AI content generation to multi-account management — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Content */}
          <div className="col-span-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-inner-soft hover-lift flex flex-col justify-between h-80">
            <div>
              <div className="bg-[#f4f4f5] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 leading-none">AI-Powered Content</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Generate, refine, and expand LinkedIn posts with intelligent AI that learns your voice.</p>
            </div>
            <div className="bg-[#f4f4f5] rounded-t-xl h-20 mt-6 border-t border-x border-gray-200/60 p-4 flex flex-col gap-1.5 overflow-hidden">
               <div className="w-full h-2.5 bg-white rounded shadow-sm"></div>
               <div className="w-4/5 h-2.5 bg-white rounded shadow-sm"></div>
               <div className="w-1/2 h-2.5 bg-white rounded shadow-sm"></div>
            </div>
          </div>

          {/* Card 2: Smart Scheduling */}
          <div className="col-span-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-inner-soft hover-lift flex flex-col justify-between h-80">
            <div>
              <div className="bg-[#f4f4f5] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-5 h-5 text-black" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 leading-none">Smart Scheduling</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Schedule posts across multiple accounts with time-zone aware automation.</p>
            </div>
            <div className="bg-[#f4f4f5] rounded-t-xl h-20 mt-6 border-t border-x border-gray-200/60 p-3 flex gap-2 overflow-hidden items-end justify-center">
               <div className="w-8 h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center font-black text-[10px]">09</div>
               <div className="w-8 h-14 bg-black text-white rounded-lg shadow-sm flex flex-col items-center justify-center">
                 <span className="font-black text-[10px]">13</span>
                 <span className="w-1 h-1 rounded-full bg-green-400"></span>
               </div>
               <div className="w-8 h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center font-black text-[10px]">18</div>
            </div>
          </div>

          {/* Card 3: Bulk Operations */}
          <div className="col-span-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-inner-soft hover-lift flex flex-col justify-between h-80">
            <div>
              <div className="bg-[#f4f4f5] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <Layers className="w-5 h-5 text-black" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 leading-none">Bulk Operations</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Import from CSV, JSON, or text sources and deploy at scale in one click.</p>
            </div>
            <div className="bg-[#f4f4f5] rounded-t-xl h-20 mt-6 border-t border-x border-gray-200/60 p-4 flex items-center justify-center gap-3">
               <div className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase text-gray-400">JSON</div>
               <div className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase text-gray-400">CSV</div>
               <div className="bg-black text-white rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider">DEPLOY</div>
            </div>
          </div>

          {/* Card 4: Content Sources */}
          <div className="col-span-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-inner-soft hover-lift flex flex-col justify-between h-80">
            <div>
              <div className="bg-[#f4f4f5] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <FolderSync className="w-5 h-5 text-black" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 leading-none">Content Sources</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Store and organize source material — blog posts, notes, and ideas ready to publish.</p>
            </div>
            <div className="bg-[#f4f4f5] rounded-t-xl h-20 mt-6 border-t border-x border-gray-200/60 p-4 flex flex-col justify-end">
               <div className="bg-white border border-gray-100 rounded-xl p-2 shadow-sm text-[8px] font-bold text-gray-400 line-clamp-1">Idea: 5 key learnings from engineering growth...</div>
            </div>
          </div>

          {/* Card 5: Multi-Account */}
          <div className="col-span-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-inner-soft hover-lift flex flex-col justify-between h-80">
            <div>
              <div className="bg-[#f4f4f5] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-5 h-5 text-black" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 leading-none">Multi-Account</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Manage multiple LinkedIn profiles from a single dashboard with broadcast mode.</p>
            </div>
            <div className="bg-[#f4f4f5] rounded-t-xl h-20 mt-6 border-t border-x border-gray-200/60 p-4 flex items-center gap-1.5 justify-center">
               <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black">A</div>
               <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black">B</div>
               <div className="w-8 h-8 rounded-full bg-black text-white border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black">C</div>
            </div>
          </div>

          {/* Card 6: Auto-Cron Pipeline */}
          <div className="col-span-1 bg-white rounded-3xl p-8 border border-gray-200 shadow-inner-soft hover-lift flex flex-col justify-between h-80">
            <div>
              <div className="bg-[#f4f4f5] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <RefreshCw className="w-5 h-5 text-black" />
              </div>
              <h3 className="text-lg font-black text-black mb-2 leading-none">Auto-Cron Pipeline</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">Three daily posting windows with automated analytics sync and tag optimization.</p>
            </div>
            <div className="bg-[#f4f4f5] rounded-t-xl h-20 mt-6 border-t border-x border-gray-200/60 p-4 flex items-center justify-between">
               <div className="flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                 <strong className="text-[10px] font-black">09:00 AM</strong>
               </div>
               <div className="flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                 <strong className="text-[10px] font-black">01:00 PM</strong>
               </div>
               <div className="flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
                 <strong className="text-[10px] font-black">06:00 PM</strong>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── ANALYTICS SECTION ────────── */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-gray-200/60 text-center">
        <div className="max-w-xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight leading-none mb-4">Performance at a glance</h2>
          <p className="text-gray-500 font-medium text-sm sm:text-base">
            Track engagement, followers, and content performance in real time.
          </p>
        </div>

        {/* Dynamic Simulated Analytics Widget */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl hover-lift relative">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ecosystem Metrics</span>
              <h4 className="text-lg font-black text-black leading-none mt-1">Engagement Velocity</h4>
            </div>
            <div className="bg-[#f4f4f5] px-3 py-1.5 rounded-xl border border-gray-200/50 text-[10px] font-black text-black uppercase tracking-wider">
               Real-time Active
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-left bg-[#f4f4f5] border border-gray-200/50 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Impression Rate</span>
              <strong className="text-2xl font-black text-black">+240.2%</strong>
            </div>
            <div className="text-left bg-[#f4f4f5] border border-gray-200/50 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Follower Growth</span>
              <strong className="text-2xl font-black text-black">+4.5K</strong>
            </div>
            <div className="text-left bg-[#f4f4f5] border border-gray-200/50 p-4 rounded-2xl">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Reaction Speed</span>
              <strong className="text-2xl font-black text-black">Fast</strong>
            </div>
          </div>

          {/* Simple Simulated Chart Outlines */}
          <div className="h-32 flex items-end gap-3 px-4 pt-4 border-l border-b border-gray-200">
             <div className="flex-1 bg-gray-100 h-[30%] rounded-t-lg hover:bg-black transition-colors"></div>
             <div className="flex-1 bg-gray-100 h-[45%] rounded-t-lg hover:bg-black transition-colors"></div>
             <div className="flex-1 bg-gray-100 h-[60%] rounded-t-lg hover:bg-black transition-colors"></div>
             <div className="flex-1 bg-gray-100 h-[40%] rounded-t-lg hover:bg-black transition-colors"></div>
             <div className="flex-1 bg-gray-200 h-[75%] rounded-t-lg hover:bg-black transition-colors"></div>
             <div className="flex-1 bg-black h-[95%] rounded-t-lg relative">
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded whitespace-nowrap shadow">
                  Peak Post (1.2K Likes)
                </span>
             </div>
          </div>
        </div>
      </section>

      {/* ────────── PROCESS SECTION (HOW IT WORKS) ────────── */}
      <section id="how-it-works" className="py-20 px-6 max-w-5xl mx-auto border-t border-gray-200/60 scroll-mt-16 text-center">
        <div className="max-w-xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight leading-none mb-4">How it works</h2>
          <p className="text-gray-500 font-medium text-sm sm:text-base">
            Three simple steps to automate your LinkedIn content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          
          {/* Step 1 */}
          <div className="relative p-6 bg-white border border-gray-200 rounded-3xl shadow-sm hover-lift">
            <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mb-6">
              01
            </div>
            <h3 className="text-lg font-black text-black mb-3">Connect Accounts</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Link your LinkedIn profiles in one click. Manage multiple accounts from a single dashboard.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 bg-white border border-gray-200 rounded-3xl shadow-sm hover-lift">
            <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mb-6">
              02
            </div>
            <h3 className="text-lg font-black text-black mb-3">Create & Schedule</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Write posts with AI assistance, set your posting times, and let the system handle the rest.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 bg-white border border-gray-200 rounded-3xl shadow-sm hover-lift">
            <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mb-6">
              03
            </div>
            <h3 className="text-lg font-black text-black mb-3">Automate & Grow</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Posts go out automatically 3x daily. Track performance and refine your strategy over time.
            </p>
          </div>

        </div>
      </section>



      {/* ────────── DYNAMIC CTA WRAPPER ────────── */}
      <section className="py-24 px-6 bg-black text-white border-y border-gray-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
        <div className="max-w-2xl mx-auto relative z-10 animate-reveal-up">
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">Ready to automate your LinkedIn?</h2>
           <p className="text-gray-400 font-semibold mb-8 text-sm sm:text-base max-w-lg mx-auto">
             Join thousands of professionals who save hours every week with InkPost. No credit card required.
           </p>
           <div className="flex flex-col items-center gap-3">
             <Link href="/register" className="bg-white text-black text-sm font-black uppercase tracking-wider px-8 py-4 rounded-full hover:bg-gray-200 hover-scale shadow-xl shadow-black/40 flex items-center gap-2 group overflow-hidden relative">
               Start Scaling Free <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </Link>
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
               Free plan includes 10 posts/month · No credit card
             </span>
           </div>
        </div>
      </section>

      {/* ────────── FOOTER ────────── */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
             <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-black text-white w-5 h-5 rounded flex items-center justify-center font-bold text-[10px]">
                ip
              </div>
              <span className="font-extrabold text-sm tracking-tight text-black">
                InkPost
              </span>
            </Link>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              Schedule, generate, and publish LinkedIn content across multiple profiles with time-zone aware API automation.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-black uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-400">
              <li><Link href="#features" className="hover:text-black transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="hover:text-black transition-colors">How it Works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-black uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-400">
              <li><span className="cursor-default">About</span></li>
              <li><span className="cursor-default">Careers</span></li>
              <li><span className="cursor-default">Contact</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-black uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2 text-xs font-bold text-gray-400">
              <li><span className="cursor-default">Privacy</span></li>
              <li><span className="cursor-default">Terms</span></li>
              <li><span className="cursor-default">Guides</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <p>© 2026 InkPost Platform. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
             <span className="text-lg font-serif italic text-gray-400 cursor-default">in</span>
             <span className="text-lg font-black text-gray-400 cursor-default">X</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
