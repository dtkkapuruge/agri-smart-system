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
    <header
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'rgba(15,23,20,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between max-w-screen-lg mx-auto">
        {/* Left: brand + page title */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#16a34a,#059669)' }}
          >
            <span className="text-sm">🌱</span>
          </div>
          <div>
            <p className="text-xs font-semibold leading-none gradient-text">
              AgriSmart
            </p>
            <h1 className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs leading-none" style={{ color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: avatar + sign out */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg,var(--green-600),var(--emerald-600))',
              color: '#fff',
            }}
          >
            {initials}
          </div>
          <button
            id="sign-out-btn"
            onClick={handleSignOut}
            className="btn-outline text-xs px-3 py-1.5 hidden sm:block"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
