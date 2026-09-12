import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Static / internal — skip
  if (
    path.includes('._next') ||
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.ico') ||
    path.includes('.png') ||
    path.includes('.svg') ||
    path.includes('.webp') ||
    path.includes('.jpg')
  ) {
    return NextResponse.next();
  }

  const isAuthPath = path === '/signin' || path === '/signup';
  const token = request.cookies.get('freightiq_session')?.value || '';
  const decoded = token ? decodeJwt(token) : null;

  // Not logged in → push to signin (unless already there)
  if (!isAuthPath && !decoded) {
    return NextResponse.redirect(new URL('/signin', request.nextUrl));
  }

  // Already logged in → skip auth pages
  if (isAuthPath && decoded) {
    return NextResponse.redirect(new URL('/overview', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
