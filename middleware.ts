import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';

// Define protected routes
const protectedRoutes = [
  '/',
  '/noticia',
  '/sobre'
];

// Define auth routes (should redirect to home if already authenticated)
const authRoutes = [
  '/login',
  '/register'
];

// Define public routes (always accessible)
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get user from token
  const user = AuthService.getUserFromRequest(request);
  const isAuthenticated = !!user;

  // Handle auth routes
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // Redirect authenticated users away from auth pages
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect unauthenticated users to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Add user info to headers for use in components
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.userId);
    response.headers.set('x-user-email', user.email);
    response.headers.set('x-user-name', user.name);
    return response;
  }

  // Handle API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }
    
    // Add user info to headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.userId);
    response.headers.set('x-user-email', user.email);
    response.headers.set('x-user-name', user.name);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};