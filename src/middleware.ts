import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Supported languages
const supportedLanguages = ['en', 'id'];
const defaultLanguage = 'id';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the user is accessing a dashboard page
  if (pathname.startsWith('/dashboard')) {
    // Skip redirect check for the stores management page - allow super admins direct access
    if (pathname === '/dashboard/stores') {
      return NextResponse.next();
    }
    
    // Public routes that don't require authentication or store selection
    const publicRoutes = ['/login', '/register', '/stores'];
    
    // Get the current store from cookies
    const currentStoreId = request.cookies.get('currentStoreId')?.value;
    
    // If no store is selected, redirect to store selection page
    if (!currentStoreId && !publicRoutes.some(route => pathname.startsWith(route))) {
      console.log('[Middleware] No currentStoreId found in cookies, redirecting to /stores');
      return NextResponse.redirect(new URL('/stores', request.url));
    }
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}; 