"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/posts", label: "Posts" },
  { href: "/schedules", label: "Schedules" },
  { href: "/calendar", label: "Calendar" },
  { href: "/sources", label: "Sources" },
];

const toolsLinks = [
  {
    href: "/schedule-planner",
    label: "Planner",
    icon: (
      <svg className="w-4 h-4 mr-2.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/brief",
    label: "AI Briefing",
    icon: (
      <svg className="w-4 h-4 mr-2.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM18.813 5.904L18 11l-.813-5.096L12 5l5.096-.813L18 0l.813 4.187L24 5l-5.187.813z" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg className="w-4 h-4 mr-2.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.375v-5.25zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    href: "/accounts",
    label: "Accounts",
    icon: (
      <svg className="w-4 h-4 mr-2.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20c-2.202 0-4.275-.623-6.037-1.708l-.004-.002a4.125 4.125 0 016.903-3.238 4.124 4.124 0 013.829 3.07M18 10a3 3 0 11-6 0 3 3 0 016 0zm-8-3a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    ),
  },
  {
    href: "/logs",
    label: "Audit Logs",
    icon: (
      <svg className="w-4 h-4 mr-2.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const settingsLinks = [
  { href: "/settings", label: "General Settings" },
  { href: "/settings/prompts", label: "AI Prompts" },
  { href: "/settings/cron", label: "Cron Jobs" },
  { href: "/settings/users", label: "User Management", adminOnly: true },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Avoid rendering navigation on public-facing landing page or authentication gateway
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center mr-8">
              <Link href="/dashboard" className="font-bold text-xl text-gray-900 flex items-center gap-2 select-none">
                <div className="bg-black p-1.5 rounded-lg shadow-md shadow-black/10">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                InkPost
              </Link>
            </div>

            {/* Desktop Links (Main Navigation Hub) */}
            <div className="hidden lg:flex lg:space-x-2 items-center">
              {mainLinks.map((link) => {
                const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-all hover-scale ${
                      active
                        ? "bg-gray-100 text-black shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Tools Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setToolsOpen(!toolsOpen);
                    setSettingsOpen(false);
                  }}
                  onBlur={() => setTimeout(() => setToolsOpen(false), 200)}
                  className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-all select-none cursor-pointer hover-scale ${
                    toolsOpen || toolsLinks.some((l) => pathname.startsWith(l.href))
                      ? "bg-gray-50 text-black font-bold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  Tools
                  <svg className="ml-1 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {toolsOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-gray-100 shadow-xl py-1.5 z-50 ring-1 ring-black/5 animate-slide-up">
                    {toolsLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg mx-1.5 font-medium transition-colors"
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Options, Initials, Logout */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Settings Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setSettingsOpen(!settingsOpen);
                  setToolsOpen(false);
                }}
                onBlur={() => setTimeout(() => setSettingsOpen(false), 200)}
                className={`inline-flex items-center p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-black transition-all select-none cursor-pointer ${
                  settingsOpen || settingsLinks.some((l) => pathname.startsWith(l.href))
                    ? "bg-gray-100 text-black"
                    : ""
                }`}
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-gray-100 shadow-xl py-1.5 z-50 ring-1 ring-black/5 animate-slide-up">
                  <div className="px-3.5 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                    Management
                  </div>
                  {settingsLinks
                    .filter((link) => !link.adminOnly || isAdmin)
                    .map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg mx-1.5 font-medium transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                </div>
              )}
            </div>

            {/* Profile Avatar Tag */}
            {user && (
              <div className="flex items-center gap-2.5 border-l border-gray-200 pl-3.5">
                <span className="text-sm font-bold text-gray-700 select-none max-w-[120px] truncate">
                  {user.username}
                </span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 text-white flex items-center justify-center font-bold text-sm shadow-sm select-none uppercase tracking-wider">
                  {user.username.slice(0, 2)}
                </div>
              </div>
            )}

            <button
              onClick={logout}
              className="text-sm font-semibold text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-100 hover:bg-red-50/50 px-3.5 py-2 rounded-lg transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg select-none cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drop-down (Fully reorganized and segmented) */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-5 space-y-6 shadow-xl max-h-[85vh] overflow-y-auto">
          {/* Workspace Links */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              Workspace Hubs
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mainLinks.map((link) => {
                const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-center py-3 px-3 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tools Links */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              System Tools
            </div>
            <div className="grid grid-cols-2 gap-2">
              {toolsLinks.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center py-3 px-3.5 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    {link.icon}
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings Section */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              System Settings
            </div>
            <div className="grid grid-cols-2 gap-2">
              {settingsLinks
                .filter((l) => !l.adminOnly || isAdmin)
                .map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-center py-3 px-3 rounded-xl text-xs font-bold transition-all border ${
                        active
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* Footer User Info & Logout Button */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 text-white flex items-center justify-center font-bold text-sm shadow-sm select-none uppercase tracking-wider">
                  {user.username.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 leading-none">{user.username}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">
                    {user.role || "user"}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="py-2.5 px-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
