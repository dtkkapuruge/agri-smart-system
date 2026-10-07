'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/supabase';
import { KeyRound, Mail, User, ShieldCheck, Tractor, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';

type Mode = 'login' | 'signup';

function LoginForm() {
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
    <main className="min-h-screen w-full flex items-center justify-center px-4 py-12 bg-gradient-to-br from-emerald-50 via-white to-green-50 relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div
        aria-hidden="true"
        className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-100px] left-[-80px] w-96 h-96 rounded-full bg-green-400/20 blur-3xl pointer-events-none"
      />

      <div className="w-full max-w-[420px] mx-auto relative z-10 flex flex-col gap-6">

        {/* Header / Brand */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 ring-4 ring-white">
            <span className="text-3xl">🌱</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 mt-1">
            Agri<span className="text-emerald-600">Smart</span>
          </h1>
          <p className="text-xs font-semibold text-gray-500">
            {mode === 'login'
              ? 'Welcome back! Sign in to access your marketplace'
              : 'Join AgriSmart to start trading AI-graded produce'}
          </p>
        </div>

        {/* Main Glass Card Form Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/15 flex flex-col gap-6">

          {/* Mode Switcher Tabs */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  mode === m
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Log In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Full Name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="e.g. Kamal Perera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-xs bg-emerald-50/50 border border-emerald-500/20 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>
            )}

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-xs bg-emerald-50/50 border border-emerald-500/20 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                Password
              </label>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-xs bg-emerald-50/50 border border-emerald-500/20 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            {/* Role Selector */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                I am a…
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                    role === 'farmer'
                      ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-500 text-emerald-800 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Tractor className="w-4 h-4 text-emerald-600" />
                  <span>Farmer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                    role === 'buyer'
                      ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-500 text-emerald-800 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Buyer</span>
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <span>✅ {success}</span>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover:from-emerald-500 hover:to-green-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Log In to Marketplace' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] font-medium text-gray-400">
          By continuing you agree to AgriSmart Terms & Privacy Policy
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-emerald-50">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}