'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * /dashboard  — role-aware redirect hub.
 * After login the user lands here and gets bounced to their role dashboard.
 */
export default function DashboardIndex() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Wait for profile to load before routing
    if (!profile) return;

    const role = profile.role ?? 'farmer';
    router.replace(`/dashboard/${role}`);
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div
          className="w-12 h-12 rounded-2xl mx-auto animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg,#16a34a,#059669)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Redirecting to your dashboard…
        </p>
      </div>
    </div>
  );
}
