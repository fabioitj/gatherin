import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Public paths that don't require authentication
  const publicPaths = ["/login", "/signup"];
  
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // Redirect logic
  if (isPublicPath && token) {
    // If user is authenticated and tries to access login/signup pages,
    // redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  if (!isPublicPath && !token) {
    // If user is not authenticated and tries to access a protected route,
    // redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/news/:path*",
    "/settings/:path*",
    "/alerts/:path*",
    "/favorites/:path*",
    "/login",
    "/signup",
  ],
};