'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxRate?: number;
  currency?: string;
}

interface StoreContextType {
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load store from localStorage on mount
  useEffect(() => {
    const loadStoreData = () => {
      try {
        // Check if we're in the logout process - if so, don't redirect
        const isLoggingOut = pathname === '/login' || 
                            pathname === '/logout' || 
                            sessionStorage.getItem('logout_in_progress') === 'true' ||
                            localStorage.getItem('force_logout') === 'true' ||
                            pathname.includes('force_logout=true');
        
        // If we're logging out, don't even try to load or redirect
        if (isLoggingOut) {
          console.log('StoreContext: Logout in progress, skipping store checks');
          setIsLoading(false);
          return;
        }
        
        const storeId = localStorage.getItem('currentStoreId');
        const storeName = localStorage.getItem('currentStoreName');
        
        console.log('StoreContext: Loading store data', { storeId, storeName });
        
        if (storeId && storeName) {
          // Set as cookie for server-side middleware
          document.cookie = `currentStoreId=${storeId}; path=/; max-age=${60*60*24*30}`; // 30 days
          
          setCurrentStore({
            id: storeId,
            name: storeName,
          });
          setIsLoading(false);
        } else if (pathname?.startsWith('/dashboard')) {
          // Check if the user is a super admin
          const userJson = localStorage.getItem('currentUser');
          let isSuperAdmin = false;
          
          if (userJson) {
            try {
              const user = JSON.parse(userJson);
              isSuperAdmin = user.role === 'SUPER_ADMIN' || 
                           user.stores?.some((store: any) => store.role === 'SUPER_ADMIN') ||
                           localStorage.getItem('isSuperAdmin') === 'true';
            } catch (error) {
              console.error('Error parsing user data:', error);
            }
          }
          
          // Skip redirect if user is a super admin and accessing dashboard or store management
          if (isSuperAdmin && (pathname === '/dashboard' || pathname === '/dashboard/stores' || pathname.startsWith('/dashboard/pengaturan'))) {
            console.log('StoreContext: Super admin accessing admin area, skipping redirect');
            setIsLoading(false);
          } else if (!isLoggingOut) { // Only redirect if not in logout process
            // If on dashboard with no store, redirect to store selection
            console.log('StoreContext: No store found, redirecting to /stores');
            router.push('/stores');
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading store data:', error);
        setIsLoading(false);
      }
    };
    
    loadStoreData();
    
    // Add listener for changes to localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentStoreId' || e.key === 'currentStoreName') {
        console.log('StoreContext: Storage change detected', e.key, e.newValue);
        loadStoreData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, pathname]);

  return (
    <StoreContext.Provider
      value={{
        currentStore,
        setCurrentStore,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}; 