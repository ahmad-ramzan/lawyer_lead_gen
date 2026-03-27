import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  // Public routes — no login required
  const isPublic =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/matters') ||
    pathname.startsWith('/investigations') ||
    pathname === '/';

  // Attorney-only routes
  if (pathname.startsWith('/queue')) {
    if (!token || role !== 'attorney') return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (!token || role !== 'admin') return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect logged-in attorney/admin away from auth pages
  if (pathname.startsWith('/auth') && token) {
    if (role === 'attorney') return NextResponse.redirect(new URL('/queue', request.url));
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
