'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ShoppingBag, Activity, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardNav from '@/components/DashboardNav';
import StatCard from '@/components/StatCard';

const AUDIT_LOGS = [
  { id: 'ADT-901', crop: 'Tomatoes', grade: 'A', time: '2 mins ago',  status: 'Passed'  },
  { id: 'ADT-902', crop: 'Wheat',    grade: 'C', time: '15 mins ago', status: 'Flagged' },
  { id: 'ADT-903', crop: 'Potatoes', grade: 'B', time: '1 hour ago',  status: 'Passed'  },
  { id: 'ADT-904', crop: 'Rice',     grade: 'A', time: '3 hours ago', status: 'Passed'  },
];

const GRADE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'rgba(74, 222, 128, 0.15)', text: '#15803d', border: 'rgba(74, 222, 128, 0.4)' },
  B: { bg: 'rgba(251, 191, 36, 0.15)', text: '#a16207', border: 'rgba(251, 191, 36, 0.4)' },
  C: { bg: 'rgba(248, 113, 113, 0.15)', text: '#be123c', border: 'rgba(248, 113, 113, 0.4)' },
};

export default function AdminDashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  // Auth guard — only admin
  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && profile && profile.role !== 'admin') {
      router.replace(`/dashboard/${profile.role}`);
    }
  }, [user, profile, loading, router]);

  if (loading) return <LoadingScreen />;

  const handleSignOut = async () => { await signOut(); router.push('/auth/login'); };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4fbf6]">
      <DashboardNav title="Admin Overview" subtitle="Platform metrics & AI forensics" />

      <main className="flex-1 page-container py-8 space-y-8">

        {/* Stats */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-emerald-800/60">
            Platform Snapshot
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon="👨‍🌾" label="Total Farmers"       value="1,284"  sub="Registered" />
            <StatCard icon="🧑‍💼" label="Total Buyers"         value="3,492"  sub="Registered" />
            <StatCard icon="🤖" label="AI Audits Completed"  value="14,802" sub="All-time" accent />
            <StatCard icon="🚩" label="Flagged Submissions"  value="38"     sub="Needs review" />
          </div>
        </section>

        {/* Quick management cards */}
        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800/60">
            Management & Controls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Users className="w-5 h-5 text-emerald-600" />, label: 'User Operations', sub: '1,284 Farmers · 3,492 Buyers', id: 'admin-users' },
              { icon: <ShoppingBag className="w-5 h-5 text-emerald-600" />, label: 'Product Catalog', sub: '24 Active Produce Categories', id: 'admin-products' },
              { icon: <Activity className="w-5 h-5 text-emerald-600" />, label: 'System Analytics', sub: 'Real-time AI forensics & audit logs', id: 'admin-reports' },
            ].map(({ icon, label, sub, id }) => (
              <button
                key={id}
                id={id}
                className="bg-white p-5 rounded-2xl border border-emerald-600/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    {icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {label}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Audit log */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800/60">
              Recent AI Quality Audits
            </h3>
            <span className="text-xs font-bold text-emerald-700">4 Recent Entries</span>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-600/10 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Audit ID</th>
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Crop & Grade</th>
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-right">Forensics Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {AUDIT_LOGS.map((log) => {
                    const gradeInfo = GRADE_STYLE[log.grade] ?? { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
                    return (
                      <tr key={log.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">
                          {log.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-sm text-gray-900">{log.crop}</span>
                            <span
                              className="text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs"
                              style={{
                                background: gradeInfo.bg,
                                color: gradeInfo.text,
                                borderColor: gradeInfo.border,
                              }}
                            >
                              Grade {log.grade}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400">
                          {log.time}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <StatusBadge status={log.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {AUDIT_LOGS.map((log) => {
                const gradeInfo = GRADE_STYLE[log.grade] ?? { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
                return (
                  <li key={log.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{log.crop}</span>
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                          style={{
                            background: gradeInfo.bg,
                            color: gradeInfo.text,
                            borderColor: gradeInfo.border,
                          }}
                        >
                          Grade {log.grade}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">{log.id} · {log.time}</p>
                    </div>
                    <StatusBadge status={log.status} />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Sign out (mobile) */}
        <button
          id="sign-out-mobile"
          onClick={handleSignOut}
          className="btn-outline w-full text-sm sm:hidden py-3"
        >
          Sign Out
        </button>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const passed = status === 'Passed';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${
        passed
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'bg-rose-100 text-rose-800 border border-rose-200'
      }`}
    >
      {passed
        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        : <ShieldAlert  className="w-3.5 h-3.5 text-rose-600" />}
      {status}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4fbf6]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl mx-auto animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg,#16a34a,#059669)' }} />
        <p className="text-xs font-bold text-gray-500">Loading Admin Dashboard…</p>
      </div>
    </div>
  );
}
