'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/supabase';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '';

  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<UserRole>('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error, role: profileRole } = await signIn(email, password);
        if (error) throw error;

        const resolvedRole = profileRole ?? role;
        const dest = redirect || getDashboardPath(resolvedRole);
        router.push(dest);
      } else {
        const { error } = await signUp(email, password, role, fullName);
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm, then log in.');
        setMode('login');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #ecfdf5 0%, #f8fffe 40%, #f0fdf4 80%, #e8f5ed 100%)',
      }}
    >
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="absolute top-[-80px] right-[-60px] w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-60px] left-[-40px] w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-[400px] animate-fade-up relative z-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-18 h-18 rounded-3xl mb-5 relative"
            style={{
              width: 72, height: 72,
              background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
              boxShadow: '0 12px 32px rgba(22,163,74,0.30), 0 4px 8px rgba(22,163,74,0.15)',
            }}
          >
            <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>🌱</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Agri<span style={{ color: '#16a34a' }}>Smart</span>
          </h1>
          <p className="text-sm mt-2 font-medium" style={{ color: '#64748b' }}>
            {mode === 'login'
              ? 'Welcome back to the marketplace'
              : 'Create your account to get started'}
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-card rounded-3xl p-7 sm:p-8 glow-green"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(22,163,74,0.10)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.10), 0 4px 16px rgba(22,163,74,0.08)',
          }}
        >
          {/* Mode Tabs */}
          <div
            className="flex p-1 rounded-2xl mb-7"
            style={{ background: '#f1f5f9' }}
          >
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                  setSuccess('');
                }}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-250"
                style={mode === m
                  ? {
                      background: '#fff',
                      color: '#16a34a',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    }
                  : { color: '#94a3b8' }
                }
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            {mode === 'signup' && (
              <div className="animate-fade-up">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm transition-all"
                  style={{
                    background: 'rgba(240,253,244,0.6)',
                    border: '1.5px solid rgba(22,163,74,0.14)',
                    color: '#0f172a',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  placeholder="e.g. Ravi Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#22c55e';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(22,163,74,0.14)';
                    e.target.style.background = 'rgba(240,253,244,0.6)';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-2xl text-sm transition-all"
                style={{
                  background: 'rgba(240,253,244,0.6)',
                  border: '1.5px solid rgba(22,163,74,0.14)',
                  color: '#0f172a',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#22c55e';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(22,163,74,0.14)';
                  e.target.style.background = 'rgba(240,253,244,0.6)';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3.5 rounded-2xl text-sm transition-all"
                style={{
                  background: 'rgba(240,253,244,0.6)',
                  border: '1.5px solid rgba(22,163,74,0.14)',
                  color: '#0f172a',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#22c55e';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(22,163,74,0.14)';
                  e.target.style.background = 'rgba(240,253,244,0.6)';
                  e.target.style.boxShadow = 'none';
                }}
                required
                minLength={6}
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
                I am a…
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['farmer', 'buyer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all duration-200"
                    style={role === r
                      ? {
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          border: '2px solid #22c55e',
                          boxShadow: '0 4px 12px rgba(22,163,74,0.15)',
                        }
                      : {
                          background: '#f8fafc',
                          border: '2px solid #e2e8f0',
                        }
                    }
                  >
                    <span className="text-2xl">{r === 'farmer' ? '👨‍🌾' : '🧑‍💼'}</span>
                    <span
                      className="text-sm font-bold capitalize"
                      style={{ color: role === r ? '#15803d' : '#64748b' }}
                    >
                      {r}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div
                className="text-sm rounded-2xl px-4 py-3.5 flex items-start gap-2.5 animate-fade-in"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                }}
              >
                <span className="text-base leading-none mt-0.5 flex-shrink-0">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            )}
            {success && (
              <div
                className="text-sm rounded-2xl px-4 py-3.5 flex items-start gap-2.5 animate-fade-in"
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                }}
              >
                <span className="text-base leading-none mt-0.5 flex-shrink-0">✅</span>
                <span className="font-medium">{success}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? '#86efac'
                  : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(22,163,74,0.30), 0 2px 6px rgba(22,163,74,0.15)',
                letterSpacing: '-0.01em',
              }}
            >
              {loading
                ? (mode === 'login' ? 'Logging in…' : 'Creating account…')
                : (mode === 'login' ? 'Log In →' : 'Create Account →')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 font-medium" style={{ color: '#94a3b8' }}>
          By continuing you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </main>
  );
}

function getDashboardPath(role: UserRole): string {
  const lc = role.toString().toLowerCase();
  switch (lc) {
    case 'farmer':
      return '/dashboard/farmer';
    case 'buyer':
      return '/dashboard/buyer';
    case 'admin':
      return '/dashboard/admin';
    default:
      return '/dashboard/farmer';
  }
}