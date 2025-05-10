'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Check, X, RefreshCcw, Search, Plus, Info, Eye, Settings, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useSimpleTranslation } from '@/lib/translations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [createStoreLoading, setCreateStoreLoading] = useState(false);
  const [newStoreData, setNewStoreData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxRate: '0',
    currency: 'IDR'
  });
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

  const handleCreateStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStoreData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStoreData.name.trim()) {
      toast.error('Nama toko harus diisi');
      return;
    }
    
    try {
      setCreateStoreLoading(true);
      
      // Ensure userId cookie is set
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        const user = JSON.parse(userJson);
        document.cookie = `userId=${user.id}; path=/; max-age=${60*60*24}`; // 24 hours
      }
      
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newStoreData,
          taxRate: parseFloat(newStoreData.taxRate) || 0
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Toko berhasil dibuat');
        setShowCreateStoreModal(false);
        // Reset form data
        setNewStoreData({
          name: '',
          address: '',
          phone: '',
          email: '',
          taxRate: '0',
          currency: 'IDR'
        });
        // Refresh stores list
        fetchStores();
      } else {
        toast.error(data.message || 'Gagal membuat toko');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error('Gagal membuat toko');
    } finally {
      setCreateStoreLoading(false);
    }
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
          <Button
            onClick={() => setShowCreateStoreModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Tambah Toko
          </Button>
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
          <Button
            onClick={fetchStores}
            className="flex items-center gap-2 bg-brutalism-yellow text-brutalism-black"
          >
            <RefreshCcw size={16} /> {t('store_management.refresh')}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin"></div>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white p-6 border-3 border-brutalism-black rounded-md shadow-brutal-md text-center">
          <Store size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold mb-2">{t('store_management.no_stores')}</h3>
          <p className="text-gray-600 mb-4">{t('store_management.no_stores_desc')}</p>
          <Button 
            onClick={() => setShowCreateStoreModal(true)}
            className="mx-auto"
          >
            Buat Toko
          </Button>
        </div>
      ) : (
        <>
          {/* Stores that need activation - Card Grid Layout */}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores
                  .filter(store => !store.isActive)
                  .map(store => (
                    <Card 
                      key={store.id} 
                      className="hover:shadow-brutal-sm transition-all hover:translate-y-[-2px] opacity-75"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <div className="w-16 h-16 bg-brutalism-blue border-3 border-brutalism-black flex items-center justify-center text-white text-2xl font-bold">
                            {store.name.substring(0, 2).toUpperCase()}
                          </div>
                          
                          {/* Status badge */}
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                            {t('store_management.inactive')}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">{store.name}</h2>
                        <p className="text-gray-600 mb-2">{store.address || t('store_management.address_not_available')}</p>
                        <p className="text-gray-600 text-sm mb-4">{new Date(store.createdAt).toLocaleDateString()}</p>
                        
                        <div className="flex gap-2 w-full mt-auto">
                          <Button
                            onClick={() => handleViewStoreDetails(store)}
                            variant="secondary"
                            className="flex items-center gap-1 flex-1"
                          >
                            <Eye size={14} /> {t('store_management.view')}
                          </Button>
                          {store.isActive ? (
                            <Button
                              onClick={() => toggleStoreStatus(store.id, store.isActive)}
                              className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1 flex-1"
                            >
                              <X size={14} /> {t('store_management.deactivate_store')}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => toggleStoreStatus(store.id, store.isActive)}
                              className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1 flex-1"
                            >
                              <Check size={14} /> {t('store_management.activate_store')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Main Stores - Card Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores
              .filter(store => isSuperAdmin ? store.isActive : true)
              .map(store => (
                <Card 
                  key={store.id} 
                  className="hover:shadow-brutal-sm transition-all hover:translate-y-[-2px]"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-16 h-16 bg-brutalism-blue border-3 border-brutalism-black flex items-center justify-center text-white text-2xl font-bold">
                        {store.name.substring(0, 2).toUpperCase()}
                      </div>
                      
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
                    <p className="text-gray-600 mb-2">{store.address || t('store_management.address_not_available')}</p>
                    {store.email && <p className="text-gray-500 text-sm mb-1">{store.email}</p>}
                    <p className="text-gray-500 text-sm mb-4">{new Date(store.createdAt).toLocaleDateString()}</p>
                    
                    <div className="flex gap-2 w-full mt-auto">
                      <Button
                        onClick={() => handleViewStoreDetails(store)}
                        variant="secondary"
                        className="flex items-center gap-1 flex-1"
                      >
                        <Eye size={14} /> {t('store_management.view')}
                      </Button>
                      {store.isActive ? (
                        <Button
                          onClick={() => toggleStoreStatus(store.id, store.isActive)}
                          className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1 flex-1"
                        >
                          <X size={14} /> {t('store_management.deactivate_store')}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => toggleStoreStatus(store.id, store.isActive)}
                          className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1 flex-1"
                        >
                          <Check size={14} /> {t('store_management.activate_store')}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            
            {/* Create New Store Card */}
            <Card className="border-dashed border-3 border-gray-300 bg-transparent hover:border-brutalism-black transition-all hover:translate-y-[-2px]">
              <button 
                onClick={() => setShowCreateStoreModal(true)}
                className="p-6 w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-brutalism-black"
              >
                <Plus size={48} className="mb-4" />
                <h2 className="text-xl font-bold">Buat Toko Baru</h2>
                <p className="text-center mt-2">Tambah toko baru</p>
              </button>
            </Card>
          </div>
        </>
      )}

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
              
              <div className="space-y-2 mb-6">
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
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleCloseDetails}
                  variant="secondary"
                >
                  {t('store_management.close')}
                </Button>
                {selectedStore.isActive ? (
                  <Button
                    onClick={() => {
                      toggleStoreStatus(selectedStore.id, selectedStore.isActive);
                      handleCloseDetails();
                    }}
                    className="bg-red-100 text-red-800 hover:bg-red-200"
                  >
                    {t('store_management.deactivate_store')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      toggleStoreStatus(selectedStore.id, selectedStore.isActive);
                      handleCloseDetails();
                    }}
                    className="bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    {t('store_management.activate_store')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Store Modal */}
      {showCreateStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-brutalism-black rounded-lg shadow-brutal-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Buat Toko Baru</h2>
                <button 
                  onClick={() => setShowCreateStoreModal(false)}
                  className="text-gray-500 hover:text-black"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreateStoreSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Nama Toko *</label>
                  <input
                    type="text"
                    name="name"
                    value={newStoreData.name}
                    onChange={handleCreateStoreChange}
                    placeholder="Masukkan nama toko"
                    className="w-full p-2 border-3 border-brutalism-black shadow-brutal-xs rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-medium">Alamat</label>
                  <input
                    type="text"
                    name="address"
                    value={newStoreData.address}
                    onChange={handleCreateStoreChange}
                    placeholder="Masukkan alamat toko"
                    className="w-full p-2 border-3 border-brutalism-black shadow-brutal-xs rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Telepon</label>
                    <input
                      type="tel"
                      name="phone"
                      value={newStoreData.phone}
                      onChange={handleCreateStoreChange}
                      placeholder="Masukkan nomor telepon"
                      className="w-full p-2 border-3 border-brutalism-black shadow-brutal-xs rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newStoreData.email}
                      onChange={handleCreateStoreChange}
                      placeholder="Masukkan email toko"
                      className="w-full p-2 border-3 border-brutalism-black shadow-brutal-xs rounded-md"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Pajak (%)</label>
                    <input
                      type="number"
                      name="taxRate"
                      value={newStoreData.taxRate}
                      onChange={handleCreateStoreChange}
                      placeholder="0"
                      className="w-full p-2 border-3 border-brutalism-black shadow-brutal-xs rounded-md"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-medium">Mata Uang</label>
                    <select
                      name="currency"
                      value={newStoreData.currency}
                      onChange={handleCreateStoreChange}
                      className="w-full p-2 border-3 border-brutalism-black shadow-brutal-xs rounded-md"
                    >
                      <option value="IDR">Rupiah (IDR)</option>
                      <option value="USD">Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="SGD">Dollar Singapura (SGD)</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateStoreModal(false)}
                    disabled={createStoreLoading}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center gap-2"
                    disabled={createStoreLoading}
                  >
                    {createStoreLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Simpan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 