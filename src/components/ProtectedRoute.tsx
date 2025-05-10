'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * A component to wrap around routes that require authentication
 * If not authenticated, redirects to login page
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Check if the user is authenticated
    if (!isAuthenticated()) {
      // Redirect to login page
      router.replace('/login');
    } else {
      setIsChecking(false);
    }
  }, [router]);
  
  // Show nothing while checking authentication
  if (isChecking) {
    return null;
  }
  
  // Render the children if authenticated
  return <>{children}</>;
} 