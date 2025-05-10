'use client';

import React, { useState, useEffect } from 'react';
import { Store, Home } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface StoreItem {
  id: string;
  name: string;
  address?: string;
}

const StoreSelector = () => {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { currentStore, setCurrentStore } = useStore();
  const settings = useSettings();
  const router = useRouter();

  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'your_stores': 'Toko Anda',
        'select_store': 'Pilih Toko',
        'no_stores': 'Anda belum memiliki toko',
        'error_loading': 'Gagal memuat daftar toko',
        'current_store': 'Toko Saat Ini'
      },
      'en': {
        'your_stores': 'Your Stores',
        'select_store': 'Select Store',
        'no_stores': 'You don\'t have any stores yet',
        'error_loading': 'Failed to load stores',
        'current_store': 'Current Store'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };

  useEffect(() => {
    const loadStores = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get current user from localStorage
        const userJson = localStorage.getItem('currentUser');
        if (!userJson) {
          setLoading(false);
          return;
        }
        
        const user = JSON.parse(userJson);
        
        // Fetch stores for this user
        const response = await fetch(`/api/stores?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setStores(data.stores || []);
      } catch (error) {
        console.error('Error loading stores:', error);
        setError(t('error_loading'));
      } finally {
        setLoading(false);
      }
    };
    
    loadStores();
  }, []);

  const handleStoreSelect = (store: StoreItem) => {
    // Save to localStorage
    localStorage.setItem('currentStoreId', store.id);
    localStorage.setItem('currentStoreName', store.name);
    
    // Update context
    setCurrentStore(store);
    
    // Reload the page to apply changes across the app
    window.location.reload();
  };

  const handleSwitchStore = () => {
    // Navigate to the stores page to select a different store
    router.push('/stores');
  };

  if (loading) {
    return (
      <div className="p-4 border-3 border-brutalism-black rounded-md shadow-brutal-sm bg-white animate-pulse">
        <div className="h-6 bg-gray-200 mb-2 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border-3 border-brutalism-black rounded-md shadow-brutal-sm bg-white text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-4 border-3 border-brutalism-black rounded-md shadow-brutal-sm bg-white">
        <p>{t('no_stores')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border-3 border-brutalism-black rounded-md shadow-brutal-sm bg-white mb-4">
      <div className="flex items-center mb-4">
        <Store className="w-5 h-5 mr-2" />
        <h3 className="font-bold">{t('your_stores')}</h3>
      </div>
      
      {currentStore && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-1">{t('current_store')}</p>
          <div className="p-3 bg-brutalism-yellow border-2 border-brutalism-black rounded-md flex items-center">
            <Home className="w-4 h-4 mr-2" /> 
            <span className="font-medium">{currentStore.name}</span>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {stores.map(store => (
          <button
            key={store.id}
            className={`w-full p-3 border-2 border-brutalism-black rounded-md text-left flex items-center
              ${currentStore?.id === store.id 
                ? 'bg-brutalism-yellow' 
                : 'bg-white hover:bg-gray-100'}`}
            onClick={() => handleStoreSelect(store)}
            disabled={currentStore?.id === store.id}
          >
            <Store className="w-4 h-4 mr-2" /> 
            <div>
              <span className="font-medium block">{store.name}</span>
              {store.address && <span className="text-xs text-gray-600">{store.address}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* <div className="flex items-center gap-2 mt-4">
        <Button 
          onClick={handleSwitchStore} 
          className="bg-brutalism-yellow text-brutalism-black hover:bg-white border-2 border-brutalism-black flex items-center gap-2 text-sm"
        >
          <Store size={16} />
          {currentStore?.name ? (
            <span>Switch Store</span>
          ) : (
            <span>Select Store</span>
          )}
        </Button>
      </div> */}
    </div>
  );
};

export default StoreSelector; 