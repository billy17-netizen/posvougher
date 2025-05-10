import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/utils/auth';

/**
 * Custom hook to handle authentication redirects
 * Only redirects when on public pages (/, /login, /register)
 * Also redirects from /stores if user already has a store selected
 */
export function useAuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Only check on client-side
    if (typeof window === 'undefined') return;
    
    // Define public pages
    const publicPages = ['/', '/login', '/register'];
    
    // Check if user is authenticated
    if (isAuthenticated()) {
      // For public pages, redirect to dashboard or stores
      if (publicPages.includes(pathname || '')) {
        const storeId = localStorage.getItem('currentStoreId');
        if (storeId) {
          router.replace('/dashboard');
        } else {
          router.replace('/stores');
        }
      }
      
      // Prevent accessing /stores if a store is already selected
      // Skip /stores/create, which should be accessible even with a current store
      if ((pathname === '/stores' || pathname?.startsWith('/stores/')) && 
          pathname !== '/stores/create') {
        const storeId = localStorage.getItem('currentStoreId');
        if (storeId) {
          router.replace('/dashboard');
        }
      }
    }
  }, [pathname, router]);
} 