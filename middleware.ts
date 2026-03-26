import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  const isAuth = pathname.startsWith('/auth');
  const isClient = pathname.startsWith('/(client)') || pathname.startsWith('/dashboard') || pathname.startsWith('/matters') || pathname.startsWith('/chat') || pathname.startsWith('/cases');
  const isAttorney = pathname.startsWith('/queue') || (pathname.startsWith('/cases') && role === 'attorney');
  const isAdmin = pathname.startsWith('/admin');

  if (!token && !isAuth) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (token && isAuth) {
    if (role === 'attorney') return NextResponse.redirect(new URL('/queue', request.url));
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAdmin && role !== 'admin') return NextResponse.redirect(new URL('/auth/login', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
