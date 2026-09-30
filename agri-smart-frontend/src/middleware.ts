import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that are publicly accessible (no auth required)
const PUBLIC_PATHS = ['/', '/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
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
