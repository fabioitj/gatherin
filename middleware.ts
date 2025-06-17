import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes that don't require authentication
        const publicRoutes = ['/login', '/register'];
        
        // API routes that don't require authentication
        const publicApiRoutes = ['/api/auth'];
        
        // Check if it's a public route
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          // If user is already authenticated, redirect to home
          if (token) {
            return false; // This will trigger a redirect
          }
          return true;
        }
        
        // Check if it's a public API route
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }
        
        // For all other routes, require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

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