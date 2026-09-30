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
        console.log('[LoginPage] Attempting sign in for:', email);
        const { error, role: profileRole } = await signIn(email, password);
        if (error) throw error;

        // Use role from the profiles table; fall back to UI toggle only if missing
        const resolvedRole = profileRole ?? role;
        console.log('[LoginPage] signIn succeeded — profileRole:', profileRole, '| resolvedRole:', resolvedRole);

        const dest = redirect || getDashboardPath(resolvedRole);
        console.log('[LoginPage] Redirecting to:', dest);
        router.push(dest);
      } else {
        const { error } = await signUp(email, password, role, fullName);
        if (error) throw error;
        setSuccess(
          'Account created! Check your email to confirm, then log in.'
        );
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
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background blobs */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34,197,94,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg,#16a34a,#059669)' }}>
            <span className="text-2xl">🌱</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text">AgriSmart</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            AI-powered produce grading
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6">
          {/* Mode tabs */}
          <div className="flex rounded-lg overflow-hidden mb-6"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className="flex-1 py-2 text-sm font-semibold transition-all duration-200"
                style={{
                  background: mode === m
                    ? 'linear-gradient(135deg,var(--green-600),var(--emerald-600))'
                    : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                  borderRadius: '6px',
                }}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name – signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  className="input-field"
                  placeholder="e.g. Ravi Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}>
                I am a…
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['farmer', 'buyer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    id={`role-${r}`}
                    onClick={() => setRole(r)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200"
                    style={{
                      background: role === r ? 'rgba(74,222,128,0.10)' : 'var(--surface-2)',
                      borderColor: role === r ? 'var(--border-focus)' : 'var(--border)',
                      color: role === r ? 'var(--green-400)' : 'var(--text-muted)',
                    }}
                  >
                    <span className="text-xl">{r === 'farmer' ? '👨‍🌾' : '🧑‍💼'}</span>
                    <span className="text-xs font-semibold capitalize">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error / success messages */}
            {error && (
              <p className="text-xs rounded-lg px-3 py-2"
                style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--error)' }}>
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs rounded-lg px-3 py-2"
                style={{ background: 'rgba(74,222,128,0.12)', color: 'var(--success)' }}>
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="auth-submit-btn"
              className="btn-primary w-full text-sm"
              disabled={loading}
            >
              {loading
                ? (mode === 'login' ? 'Logging in…' : 'Creating account…')
                : (mode === 'login' ? 'Log In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>
    </main>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDashboardPath(role: UserRole): string {
  const lc = role.toString().toLowerCase();
  switch (lc) {
    case 'farmer': return '/dashboard/farmer';
    case 'buyer':  return '/dashboard/buyer';
    case 'admin':  return '/dashboard/admin';
    default:       return '/dashboard/farmer';
  }
}
