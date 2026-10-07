'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Wrench,
  X,
  ExternalLink,
  UserCheck,
  LogOut,
  ChevronRight,
  Layers,
  Shield,
  ShoppingBag,
  Tractor,
  KeyRound,
  Minimize2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/supabase';

export default function DevBackdoor() {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_BACKDOOR === 'true';
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, devRole, setDevRole, signOut } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Toggle on keyboard shortcut Alt+D or Ctrl+Shift+D
  useEffect(() => {
    if (!isEnabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'd') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  const handleSimulateRole = (role: UserRole) => {
    if (setDevRole) {
      setDevRole(role);
    }
    setIsOpen(false);
    router.push(`/dashboard/${role}`);
  };

  const handleClearDevRole = async () => {
    if (setDevRole) {
      setDevRole(null);
    }
    await signOut();
    setIsOpen(false);
    router.push('/auth/login');
  };

  return (
    <>
      {/* Floating launcher button */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 print:hidden select-none">
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            title="Restore Dev Backdoor"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-900 text-white shadow-xl hover:scale-105 transition-transform border border-emerald-500/50"
          >
            <Wrench className="w-4 h-4 text-emerald-400" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-gray-950/90 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 text-xs font-bold tracking-wide hover:text-emerald-300 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dev Backdoor</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/10 text-emerald-300 rounded border border-white/10">
                Alt+D
              </kbd>
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="ml-1 p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Drawer / Modal panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 p-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="w-full sm:w-[420px] max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden animate-slide-down"
            style={{
              boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.15)',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-gray-950 via-gray-900 to-slate-900 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold tracking-tight">AgriSmart Dev Backdoor</h2>
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      DEV ONLY
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">Direct component access & session simulator</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(92vh-130px)]">
              {/* PRIMARY ACTION: Component Showcase */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  UI Component Playground
                </p>
                <Link
                  href="/dev/components"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 shadow-md shadow-emerald-600/25 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-snug">All UI Components Showcase</p>
                      <p className="text-[11px] text-emerald-100 font-medium">
                        Preview & test StatCards, Chat, Modals, Forms & Badges
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* ROLE SIMULATION */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-500/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-gray-800">Simulate Auth Session</span>
                  </div>
                  {devRole && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800">
                      Simulated: {devRole}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Bypass Supabase credentials and instantly preview role dashboards in development mode.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleSimulateRole('farmer')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      profile?.role === 'farmer'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-emerald-50 text-gray-800 border-gray-200'
                    }`}
                  >
                    <Tractor className="w-4 h-4" />
                    <span className="text-xs font-bold">Farmer</span>
                    <span className={`text-[10px] ${profile?.role === 'farmer' ? 'text-emerald-100' : 'text-gray-400'}`}>
                      Dashboard
                    </span>
                  </button>

                  <button
                    onClick={() => handleSimulateRole('buyer')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      profile?.role === 'buyer'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-emerald-50 text-gray-800 border-gray-200'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-xs font-bold">Buyer</span>
                    <span className={`text-[10px] ${profile?.role === 'buyer' ? 'text-emerald-100' : 'text-gray-400'}`}>
                      Dashboard
                    </span>
                  </button>

                  <button
                    onClick={() => handleSimulateRole('admin')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      profile?.role === 'admin'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-emerald-50 text-gray-800 border-gray-200'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold">Admin</span>
                    <span className={`text-[10px] ${profile?.role === 'admin' ? 'text-emerald-100' : 'text-gray-400'}`}>
                      Dashboard
                    </span>
                  </button>
                </div>

                {(user || devRole) && (
                  <button
                    onClick={handleClearDevRole}
                    className="w-full mt-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Reset Dev Session / Log Out
                  </button>
                )}
              </div>

              {/* QUICK ROUTE JUMP */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                  Quick Navigation Links
                </p>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Login & Register Screen', path: '/auth/login', icon: KeyRound },
                    { label: 'Farmer Dashboard (/dashboard/farmer)', path: '/dashboard/farmer', icon: Tractor },
                    { label: 'Buyer Dashboard (/dashboard/buyer)', path: '/dashboard/buyer', icon: ShoppingBag },
                    { label: 'Admin Dashboard (/dashboard/admin)', path: '/dashboard/admin', icon: Shield },
                    { label: 'Root Redirect Hub (/)', path: '/', icon: ExternalLink },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                        pathname === item.path
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-white hover:bg-slate-50 text-gray-700 border-gray-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-gray-400" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* CURRENT CONTEXT INFO */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 text-[11px] text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Current Route:</span>
                  <span className="font-mono text-gray-800">{pathname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Active User:</span>
                  <span className="font-mono text-gray-800 truncate max-w-[200px]">
                    {user?.email ?? 'Unauthenticated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Active Role:</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {profile?.role ?? 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Environment: <strong className="text-gray-700">development</strong></span>
              <span className="text-[10px] text-gray-400">Shortcut: Alt+D</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
