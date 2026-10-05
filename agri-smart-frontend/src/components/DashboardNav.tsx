'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface DashboardNavProps {
  title: string;
  subtitle?: string;
}

export default function DashboardNav({ title, subtitle }: DashboardNavProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(22,163,74,0.08)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}>
      <div className="flex items-center justify-between max-w-screen-lg mx-auto">
        {/* Left: brand + page title */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
              boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
            }}
          >
            <span className="text-xl">🌱</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-green-600 leading-none mb-0.5 uppercase tracking-widest">
              AgriSmart
            </p>
            <h1 className="text-sm font-bold text-gray-900 leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-gray-400 leading-none mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: avatar + sign out */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
              boxShadow: '0 2px 8px rgba(22,163,74,0.30)',
              border: '2px solid rgba(255,255,255,0.8)',
            }}
          >
            {initials}
          </div>
          <button
            id="sign-out-btn"
            onClick={handleSignOut}
            className="text-xs font-semibold text-gray-500 hover:text-green-700 border border-gray-200 hover:border-green-200 hover:bg-green-50 bg-white px-3.5 py-2 rounded-xl transition-all duration-200 hidden sm:block"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
