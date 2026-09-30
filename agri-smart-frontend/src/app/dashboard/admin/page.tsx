'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ShoppingBag, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardNav from '@/components/DashboardNav';
import StatCard from '@/components/StatCard';

const AUDIT_LOGS = [
  { id: 'ADT-901', crop: 'Tomatoes', grade: 'A', time: '2 mins ago',  status: 'Passed'  },
  { id: 'ADT-902', crop: 'Wheat',    grade: 'C', time: '15 mins ago', status: 'Flagged' },
  { id: 'ADT-903', crop: 'Potatoes', grade: 'B', time: '1 hour ago',  status: 'Passed'  },
  { id: 'ADT-904', crop: 'Rice',     grade: 'A', time: '3 hours ago', status: 'Passed'  },
];

const GRADE_COLOR: Record<string, string> = {
  A: '#4ade80',
  B: '#fbbf24',
  C: '#f87171',
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
    <div className="min-h-screen flex flex-col">
      <DashboardNav title="Admin Overview" subtitle="Platform metrics & AI forensics" />

      <main className="flex-1 px-4 py-6 max-w-screen-lg mx-auto w-full space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="👨‍🌾" label="Total Farmers"       value="1,284"  sub="Registered" />
          <StatCard icon="🧑‍💼" label="Total Buyers"         value="3,492"  sub="Registered" />
          <StatCard icon="🤖" label="AI Audits Completed"  value="14,802" sub="All-time" accent />
          <StatCard icon="🚩" label="Flagged Submissions"  value="38"     sub="Needs review" />
        </div>

        {/* Quick management cards */}
        <section>
          <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}>
            Management
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { icon: <Users className="w-5 h-5" />,      label: 'Users',    id: 'admin-users'    },
              { icon: <ShoppingBag className="w-5 h-5" />, label: 'Products', id: 'admin-products' },
              { icon: <Activity className="w-5 h-5" />,   label: 'Reports',  id: 'admin-reports'  },
            ].map(({ icon, label, id }) => (
              <button
                key={id}
                id={id}
                className="glass-card p-4 flex flex-col items-start gap-2 hover:scale-[1.02] transition-transform duration-200 text-left"
              >
                <span style={{ color: 'var(--green-400)' }}>{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage →</span>
              </button>
            ))}
          </div>
        </section>

        {/* Audit log */}
        <section>
          <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}>
            Recent AI Quality Audits
          </h3>
          <div className="glass-card overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  <tr>
                    {['Audit ID', 'Crop & Grade', 'Timestamp', 'Forensics Status'].map((h) => (
                      <th key={h} className="px-4 py-3 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {AUDIT_LOGS.map((log) => (
                    <tr key={log.id} className="hover:brightness-110 transition-all">
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {log.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-sm">{log.crop}</span>
                        <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: `${GRADE_COLOR[log.grade] ?? '#fff'}22`,
                            color:       GRADE_COLOR[log.grade] ?? '#fff',
                          }}>
                          {log.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {log.time}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="sm:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
              {AUDIT_LOGS.map((log) => (
                <li key={log.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{log.crop}
                      <span className="ml-2 text-xs font-bold"
                        style={{ color: GRADE_COLOR[log.grade] ?? '#fff' }}>
                        {log.grade}
                      </span>
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.id} · {log.time}</p>
                  </div>
                  <StatusBadge status={log.status} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Sign out (mobile) */}
        <button
          id="sign-out-mobile"
          onClick={handleSignOut}
          className="btn-outline w-full text-sm sm:hidden"
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
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
      style={{
        background: passed ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
        color:      passed ? 'var(--success)'         : 'var(--error)',
      }}
    >
      {passed
        ? <CheckCircle2 className="w-3.5 h-3.5" />
        : <ShieldAlert  className="w-3.5 h-3.5" />}
      {status}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl mx-auto animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg,#16a34a,#059669)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    </div>
  );
}
