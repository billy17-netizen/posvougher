import { NextRequest, NextResponse } from 'next/server';

// Public pages that don't require authentication
const publicPages = ['/', '/login', '/register'];

// Pages that require authentication
const protectedPages = ['/dashboard', '/stores', '/profile'];

export function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  
  // Get authentication status from cookies
  const userId = request.cookies.get('userId')?.value;
  const isLoggedIn = !!userId;
  const currentStoreId = request.cookies.get('currentStoreId')?.value;
  const referer = request.headers.get('referer') || '';
  const isComingFromDashboard = referer.includes('/dashboard');
  
  // Public pages - redirect to dashboard if logged in
  if (publicPages.some(page => currentPath === page || currentPath.startsWith(page + '/'))) {
    if (isLoggedIn) {
      // Get current store from cookies
      const storeId = request.cookies.get('currentStoreId')?.value;
      
      // Redirect to appropriate page based on cookie
      return NextResponse.redirect(
        new URL(storeId ? '/dashboard' : '/stores', request.url)
      );
    }
  }
  
  // Prevent accessing /stores if user already has a store selected
  if (currentPath === '/stores' || currentPath.startsWith('/stores/')) {
    // If path is exactly /stores/create, allow it - so users can create new stores
    if (currentPath === '/stores/create') {
      return NextResponse.next();
    }
    
    // Allow access to /stores if coming from dashboard (store switching)
    if (isComingFromDashboard) {
      return NextResponse.next();
    }
    
    // If user is logged in and already has a store selected (and not coming from dashboard),
    // redirect to dashboard
    if (isLoggedIn && currentStoreId && !isComingFromDashboard) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Protected pages - redirect to login if not logged in
  if (protectedPages.some(page => currentPath === page || currentPath.startsWith(page + '/'))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for:
    // - API routes
    // - Static files (images, js, css)
    // - Favicon
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
}; 