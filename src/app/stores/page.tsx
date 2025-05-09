'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StoreIcon, PlusCircle, LogIn, LogOut, User, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSimpleTranslation } from '@/lib/translations';

interface Store {
  id: string;
  name: string;
  address: string;
  logo?: string;
  isActive: boolean;
}

export default function StoresPage() {
  const { t } = useSimpleTranslation();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  // Ref to track if we've already fetched stores to prevent multiple fetches
  const fetchedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // Separate useEffect for checking superadmin status
  useEffect(() => {
    console.log("Running auth check useEffect");
    // Check for superadmin flag first
    const isSuperAdminFlag = localStorage.getItem('isSuperAdmin') === 'true';
    
    if (isSuperAdminFlag) {
      console.log('Superadmin detected in stores page, redirecting to dashboard/stores');
      window.location.href = '/dashboard/stores';
      return;
    }
    
    // Check user in localStorage
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      // No user found, redirect to login
      console.log("No user found, redirecting to login");
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userJson);
      // Store user ID in ref for stable comparison
      userIdRef.current = user.id;
      setCurrentUser(user);
      
      // Check if user is a SUPER_ADMIN
      const isSuperAdmin = user.role === 'SUPER_ADMIN' ||
                           user.stores?.some((store: any) => store.role === 'SUPER_ADMIN');
      
      if (isSuperAdmin) {
        console.log('Superadmin detected, redirecting to dashboard/stores');
        window.location.href = '/dashboard/stores';
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setError('Error loading user data');
      setLoading(false);
    }
  }, [router]);
  
  // Separate useEffect for fetching stores
  useEffect(() => {
    // Only fetch stores if we have a currentUser and they're not a superadmin
    // And only if we haven't fetched them already
    if (!currentUser || !userIdRef.current || fetchedRef.current) {
      console.log("Skipping fetch - conditions not met or already fetched", {
        hasCurrentUser: !!currentUser,
        userId: userIdRef.current,
        alreadyFetched: fetchedRef.current
      });
      return;
    }
    
    console.log("Running fetch stores useEffect for userId:", userIdRef.current);
    
    const fetchStores = async () => {
      try {
        // Mark as fetched to prevent multiple fetches
        fetchedRef.current = true;
        
        // Set userId cookie for API authentication
        document.cookie = `userId=${userIdRef.current || ''}; path=/; max-age=${60*60*24}`; // 24 hours
        
        // Include userId as query parameter as required by the API
        const url = `/api/stores?userId=${encodeURIComponent(userIdRef.current || '')}`;
        console.log('Fetching stores from URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store', // Prevent caching
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Unauthorized - redirecting to login');
            // If unauthorized, redirect to login
            router.push('/login');
            return;
          }
          throw new Error('Failed to load stores');
        }
        
        const data = await response.json();
        console.log('Fetched stores:', data.stores?.length || 0);
        setStores(data.stores || []);
      } catch (error) {
        console.error('Error loading stores:', error);
        setError(t('store_management.loading_error') || 'Failed to load stores');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStores();
  }, [currentUser, router, t]);

  const handleSelectStore = (storeId: string) => {
    console.log('Selecting store:', storeId);
    try {
      // Find the store in the array
      const selectedStore = stores.find(store => store.id === storeId);
      if (!selectedStore) {
        console.error('Could not find store with ID:', storeId);
        return;
      }
      
      // Check if store is active
      if (!selectedStore.isActive) {
        // Show a toast message explaining the store is inactive
        toast.error(t('store_management.inactive_store'));
        return;
      }
      
      // Save selected store to localStorage
      localStorage.setItem('currentStoreId', storeId);
      localStorage.setItem('currentStoreName', selectedStore.name);
      
      // Also set as a cookie for middleware
      document.cookie = `currentStoreId=${storeId}; path=/; max-age=${60*60*24*30}`; // 30 days
      
      // Use window.location for navigation to force a full page reload
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error selecting store:', error);
    }
  };

  const handleCreateNewStore = () => {
    router.push('/stores/create');
  };
  
  const handleLogout = async () => {
    try {
      // Clear local storage and cookies
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentStoreId');
      localStorage.removeItem('currentStoreName');
      localStorage.removeItem('isSuperAdmin'); // Clear the superadmin flag
      
      // Clear cookies
      document.cookie = 'currentStoreId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Call the logout API if needed
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="font-medium">{t('store_management.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex justify-between items-center mb-8 border-b-3 border-brutalism-black pb-4">
        <h1 className="text-3xl font-bold">{t('store_management.select_store')}</h1>
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-2 bg-brutalism-yellow px-3 py-2 rounded-md border-2 border-brutalism-black">
              <User size={18} />
              <span className="font-medium">{currentUser.name || currentUser.username}</span>
            </div>
          )}
          <Button 
            onClick={handleLogout} 
            className="bg-red-100 text-red-800 hover:bg-red-200 border-2 border-brutalism-black flex items-center gap-2"
          >
            <LogOut size={18} />
            {t('logout')}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-3 border-brutalism-red p-4 mb-6 text-red-900">
          {error}
        </div>
      )}
      
      {stores.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-brutalism-yellow border-3 border-brutalism-black rounded-full flex items-center justify-center mx-auto mb-6">
            <StoreIcon size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-4">{t('store_management.no_stores')}</h2>
          <p className="mb-6 max-w-lg mx-auto">{t('store_management.no_store_desc')}</p>
          <Button onClick={handleCreateNewStore} className="flex items-center gap-2 mx-auto">
            <PlusCircle size={20} /> {t('store_management.create_store')}
          </Button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stores.map(store => (
              <Card 
                key={store.id} 
                className={`hover:shadow-brutal-sm transition-all hover:translate-y-[-2px] ${!store.isActive ? 'opacity-75' : ''}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    {store.logo ? (
                      <img src={store.logo} alt={store.name} className="w-16 h-16 object-contain" />
                    ) : (
                      <div className="w-16 h-16 bg-brutalism-blue border-3 border-brutalism-black flex items-center justify-center text-white text-2xl font-bold">
                        {store.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      store.isActive 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {store.isActive ? t('store_management.active') : t('store_management.inactive')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-2">{store.name}</h2>
                  <p className="text-gray-600 mb-4">{store.address || t('store_management.address_not_available')}</p>
                  
                  {store.isActive ? (
                    <Button 
                      onClick={() => handleSelectStore(store.id)} 
                      className="w-full flex items-center justify-center gap-2"
                      type="button"
                    >
                      <LogIn size={18} /> {t('store_management.enter_store')}
                    </Button>
                  ) : (
                    <div className="w-full">
                      <Button 
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                        type="button"
                        disabled
                      >
                        <Lock size={18} /> {t('store_management.awaiting')}
                      </Button>
                      <p className="text-xs text-center mt-2 text-red-600">{t('store_management.inactive_store')}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
            
            {/* Create New Store Card */}
            <Card className="border-dashed border-3 border-gray-300 bg-transparent hover:border-brutalism-black transition-all hover:translate-y-[-2px]">
              <button 
                onClick={handleCreateNewStore}
                className="p-6 w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-brutalism-black"
              >
                <PlusCircle size={48} className="mb-4" />
                <h2 className="text-xl font-bold">{t('store_management.create_store')}</h2>
                <p className="text-center mt-2">{t('store_management.add_new')}</p>
              </button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 