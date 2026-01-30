import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes - authentication not required
const PUBLIC_ROUTES = ['/signup', '/login'];

// API routes - protected by backend
const API_ROUTES = ['/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes
  if (API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip middleware for Static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // .css, .js, .jpg, etc.
  ) {
    return NextResponse.next();
  }

  // Public routes - no authentication check required
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // 🔒 SECURITY: Check Token
  // Note: middleware has no localStorage, so we use cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // No token - redirect to signup page
    const signupUrl = new URL('/signup', request.url);

    // Save current URL to redirect back after login
    signupUrl.searchParams.set('redirect', pathname);

    return NextResponse.redirect(signupUrl);
  }

  // Token exists - continue
  return NextResponse.next();
}

// Which routes middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};
