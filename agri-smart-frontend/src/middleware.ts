import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that are publicly accessible (no auth required)
const PUBLIC_PATHS = ['/', '/auth/login', '/auth/signup', '/dev', '/dev/components'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and any /dev paths
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/dev')) {
    return NextResponse.next();
  }

  // ─── Development Backdoor Bypass ───────────────────────────────────────────
  // In development mode only, allow access if the agri_dev_role cookie is present
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_BACKDOOR === 'true';
  const devRoleCookie = request.cookies.get('agri_dev_role')?.value;
  if (isEnabled && devRoleCookie) {
    return NextResponse.next();
  }

  // ─── Supabase v2 auth cookie detection ───────────────────────────────────────
  // Supabase JS v2 stores the session in cookies named:
  //   sb-<project-ref>-auth-token          (small sessions)
  //   sb-<project-ref>-auth-token.0, .1 …  (chunked for large JWTs)
  // The old names "sb-access-token" and "sb-refresh-token" are NOT used by v2.
  const allCookies = request.cookies.getAll();
  const hasSupabaseSession = allCookies.some(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );

  if (!hasSupabaseSession && pathname.startsWith('/dashboard')) {
    // Redirect unauthenticated users to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    console.log('[Middleware] No session cookie found — redirecting to login');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
