'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Check, X, RefreshCcw, Search, Plus, Info, Eye, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useSimpleTranslation } from '@/lib/translations';

type StoreType = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  taxRate?: number;
  currency?: string;
};

export default function StoresPage() {
  const { t } = useSimpleTranslation();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const router = useRouter();
  
  const fetchStores = async () => {
    try {
      setLoading(true);
      
      // Ensure userId cookie is set
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        const user = JSON.parse(userJson);
        document.cookie = `userId=${user.id}; path=/; max-age=${60*60*24}`; // 24 hours
      }
      
      const response = await fetch('/api/stores');
      const data = await response.json();
      
      if (data.success) {
        setStores(data.stores);
      } else {
        toast.error(data.message || 'Failed to load stores');
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      // Ensure userId cookie is set before making the request
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        const user = JSON.parse(userJson);
        document.cookie = `userId=${user.id}; path=/; max-age=${60*60*24}`; // 24 hours
      }
      
      const response = await fetch(`/api/stores/${storeId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setStores(prevStores => 
          prevStores.map(store => 
            store.id === storeId 
              ? { ...store, isActive: !store.isActive } 
              : store
          )
        );
        
        toast.success(
          `Store ${!currentStatus ? 'activated' : 'deactivated'} successfully`
        );
        
        // Update the selected store if it's the one being toggled
        if (selectedStore && selectedStore.id === storeId) {
          setSelectedStore({
            ...selectedStore,
            isActive: !currentStatus
          });
        }
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error toggling store status:', error);
      toast.error('Operation failed');
    }
  };

  const checkUserRole = () => {
    const userJson = localStorage.getItem('currentUser');
    // Also check for superadmin flag set during login
    const isSuperAdminFlag = localStorage.getItem('isSuperAdmin') === 'true';
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        
        // Set userId cookie for API authentication
        document.cookie = `userId=${user.id}; path=/; max-age=${60*60*24}`; // 24 hours
        
        // Check if user is SUPER_ADMIN
        const hasSuperAdminRole = user.role === 'SUPER_ADMIN' || 
                                 user.stores?.some((store: any) => store.role === 'SUPER_ADMIN') ||
                                 isSuperAdminFlag;
        
        console.log("User role from stores page:", user.role);
        console.log("Is super admin from flag:", isSuperAdminFlag);
        console.log("Has super admin role calculated:", hasSuperAdminRole);
        
        setIsSuperAdmin(hasSuperAdminRole);
        
        if (!hasSuperAdminRole) {
          // Redirect to dashboard if not a super admin
          toast.error('You do not have permission to access this page');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/dashboard');
      }
    } else {
      // No user found, redirect to login
      router.push('/login');
    }
  };
  
  const handleViewStoreDetails = (store: StoreType) => {
    setSelectedStore(store);
    setShowStoreDetails(true);
  };
  
  const handleCloseDetails = () => {
    setShowStoreDetails(false);
  };
  
  const enterStore = (storeId: string, storeName: string) => {
    // Save store information to localStorage
    localStorage.setItem('currentStoreId', storeId);
    localStorage.setItem('currentStoreName', storeName);
    document.cookie = `currentStoreId=${storeId}; path=/; max-age=${60*60*24*30}`; // 30 days
    
    // Redirect to the dashboard
    router.push('/dashboard');
  };

  // Check for superadmin status immediately on component load
  useEffect(() => {
    // Immediate superadmin check
    const checkSuperAdmin = () => {
      const userJson = localStorage.getItem('currentUser');
      const isSuperAdminFlag = localStorage.getItem('isSuperAdmin') === 'true';
      
      if (!userJson && !isSuperAdminFlag) {
        // No user, redirect to login
        router.replace('/login');
        return false;
      }
      
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          const hasSuperAdminRole = user.role === 'SUPER_ADMIN' || 
                                  user.stores?.some((store: any) => store.role === 'SUPER_ADMIN') ||
                                  isSuperAdminFlag;
          
          if (!hasSuperAdminRole) {
            // Not a superadmin, redirect to dashboard
            toast.error('You do not have permission to access this page');
            router.replace('/dashboard');
            return false;
          }
          
          return true;
        } catch (e) {
          console.error('Error parsing user data:', e);
          router.replace('/login');
          return false;
        }
      }
      
      return isSuperAdminFlag;
    };
    
    // Run check immediately
    const isSuperAdmin = checkSuperAdmin();
    setIsSuperAdmin(!!isSuperAdmin);
  }, [router]);
  
  // Run fetch operations after superadmin status is confirmed
  useEffect(() => {
    if (isSuperAdmin) {
      checkUserRole();
      fetchStores();
    }
  }, [isSuperAdmin]);

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (store.email && store.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 border-b-3 border-brutalism-black pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{t('store_management.title')}</h1>
          <p className="text-gray-600">{t('store_management.subtitle')}</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link 
            href="/dashboard/stores/create" 
            className="btn btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" /> {t('store_management.add_new')}
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 border-3 border-brutalism-black rounded-md shadow-brutal-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input w-full pl-10 py-2 border-2 border-brutalism-black rounded-md"
              placeholder={t('store_management.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={fetchStores} 
            className="btn btn-secondary flex items-center justify-center"
          >
            <RefreshCcw size={16} className="mr-2" /> {t('store_management.refresh')}
          </button>
        </div>
      </div>

      {/* Pending Activation Stores Section */}
      {isSuperAdmin && filteredStores.some(store => !store.isActive) && (
        <div className="mb-8">
          <div className="bg-yellow-50 border-3 border-brutalism-yellow p-4 rounded-md mb-4">
            <h2 className="text-xl font-bold flex items-center mb-2">
              <Info size={20} className="mr-2 text-yellow-600" /> 
              {t('store_management.awaiting_activation')}
            </h2>
            <p className="text-gray-700 mb-2">
              {t('store_management.awaiting_desc')}
            </p>
          </div>
          
          <div className="bg-white border-3 border-brutalism-black rounded-md shadow-brutal-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-brutalism-black">
                <thead className="bg-brutalism-yellow">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-brutalism-black uppercase tracking-wider">
                      {t('store_management.store_name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-brutalism-black uppercase tracking-wider">
                      {t('store_management.details')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-brutalism-black uppercase tracking-wider">
                      {t('store_management.created_at')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-brutalism-black uppercase tracking-wider">
                      {t('store_management.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-brutalism-black">
                  {filteredStores
                    .filter(store => !store.isActive)
                    .map(store => (
                    <tr key={store.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0 mr-3 bg-gray-100 border-2 border-brutalism-black rounded-md flex items-center justify-center">
                            <Store size={14} />
                          </div>
                          <div>
                            <div className="font-bold text-brutalism-black">{store.name}</div>
                            <div className="text-xs text-gray-500">
                              {t('store_management.status')}: <span className="text-yellow-600 font-medium">{t('store_management.awaiting')}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm">
                          {store.address && <div className="text-gray-900">{store.address}</div>}
                          {store.email && <div className="text-gray-500 text-xs">{store.email}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(store.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewStoreDetails(store)}
                          className="btn btn-sm btn-outline flex items-center"
                        >
                          <Eye size={14} className="mr-1" /> {t('store_management.view')}
                        </button>
                        <button
                          onClick={() => toggleStoreStatus(store.id, store.isActive)}
                          className="btn btn-sm btn-success flex items-center"
                        >
                          <Check size={14} className="mr-1" /> {t('store_management.activate')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Stores Table */}
      <div className="bg-white border-3 border-brutalism-black rounded-md shadow-brutal-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-brutalism-black">
            <thead className="bg-brutalism-blue">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('store_management.store_name')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('store_management.details')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('store_management.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t('store_management.created_at')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  {t('store_management.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-brutalism-black">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-brutalism-blue border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>{t('store_management.loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Store size={32} className="text-gray-400 mb-2" />
                      <span>{t('store_management.no_stores')}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                // Filter to only show active stores in the main table
                filteredStores
                  .filter(store => isSuperAdmin ? store.isActive : true)
                  .map(store => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0 mr-3 bg-gray-100 border-2 border-brutalism-black rounded-md flex items-center justify-center">
                          <Store size={14} />
                        </div>
                        <div>
                          <div className="font-bold text-brutalism-black">{store.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm">
                        {store.address && <div className="text-gray-900">{store.address}</div>}
                        {store.email && <div className="text-gray-500 text-xs">{store.email}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        store.isActive 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {store.isActive ? t('store_management.active') : t('store_management.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(store.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewStoreDetails(store)}
                        className="btn btn-sm btn-outline flex items-center"
                      >
                        <Eye size={14} className="mr-1" /> {t('store_management.view')}
                      </button>
                      <button
                        onClick={() => toggleStoreStatus(store.id, store.isActive)}
                        className={`btn btn-sm ${store.isActive ? 'btn-danger' : 'btn-success'} flex items-center`}
                      >
                        {store.isActive ? (
                          <>
                            <X size={14} className="mr-1" /> {t('store_management.deactivate')}
                          </>
                        ) : (
                          <>
                            <Check size={14} className="mr-1" /> {t('store_management.activate')}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Details Modal */}
      {showStoreDetails && selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-brutalism-black rounded-lg shadow-brutal-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedStore.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium 
                  ${selectedStore.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedStore.isActive ? t('store_management.active') : t('store_management.inactive')}
                </span>
              </div>
              
              <div className="mb-6 space-y-3">
                {selectedStore.address && (
                  <div className="flex">
                    <span className="font-semibold w-24">{t('store_management.address')}:</span>
                    <span>{selectedStore.address}</span>
                  </div>
                )}
                
                {selectedStore.phone && (
                  <div className="flex">
                    <span className="font-semibold w-24">{t('store_management.phone')}:</span>
                    <span>{selectedStore.phone}</span>
                  </div>
                )}
                
                {selectedStore.email && (
                  <div className="flex">
                    <span className="font-semibold w-24">{t('store_management.email')}:</span>
                    <span>{selectedStore.email}</span>
                  </div>
                )}
                
                {selectedStore.taxRate !== undefined && (
                  <div className="flex">
                    <span className="font-semibold w-24">{t('store_management.tax_rate')}:</span>
                    <span>{selectedStore.taxRate}%</span>
                  </div>
                )}
                
                {selectedStore.currency && (
                  <div className="flex">
                    <span className="font-semibold w-24">{t('store_management.currency')}:</span>
                    <span>{selectedStore.currency}</span>
                  </div>
                )}
                
                <div className="flex">
                  <span className="font-semibold w-24">{t('store_management.created')}:</span>
                  <span>{new Date(selectedStore.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between gap-3 mt-8">
                <button
                  onClick={() => toggleStoreStatus(selectedStore.id, selectedStore.isActive)}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium
                    ${selectedStore.isActive 
                      ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                >
                  {selectedStore.isActive ? (
                    <>
                      <X size={16} className="mr-2" /> {t('store_management.deactivate_store')}
                    </>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" /> {t('store_management.activate_store')}
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => enterStore(selectedStore.id, selectedStore.name)}
                  className="flex-1 flex items-center justify-center py-2 px-4 bg-brutalism-blue text-white rounded-md text-sm font-medium"
                >
                  <Eye size={16} className="mr-2" /> {t('store_management.enter_store')}
                </button>
              </div>
              
              <button
                onClick={handleCloseDetails}
                className="w-full mt-4 py-2 border-2 border-brutalism-black rounded-md text-sm font-medium hover:bg-gray-100"
              >
                {t('store_management.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 