import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, LogOut, User, UserPlus, Search } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useLoading } from '@/contexts/LoadingContext';

interface QuickLoginFormProps {
  onCancel: () => void;
  storeId: string;
  currentUser: any;
}

interface UserSearchProps {
  onCancel: () => void;
  storeId: string;
  onUserAdded: () => void;
}

interface CashierUser {
  id: string;
  name: string;
  username: string;
  role: string;
}

// User search and add component
const UserSearch = ({ onCancel, storeId, onUserAdded }: UserSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const settings = useSettings();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'search_users': 'Cari Pengguna',
        'search_placeholder': 'Cari berdasarkan nama atau username...',
        'no_results': 'Tidak ada hasil ditemukan',
        'add_user': 'Tambahkan',
        'adding': 'Menambahkan...',
        'added': 'Ditambahkan',
        'close': 'Tutup',
        'user_added': 'Pengguna berhasil ditambahkan ke toko',
        'error_adding': 'Gagal menambahkan pengguna',
        'has_access': 'Sudah memiliki akses'
      },
      'en': {
        'search_users': 'Search Users',
        'search_placeholder': 'Search by name or username...',
        'no_results': 'No results found',
        'add_user': 'Add',
        'adding': 'Adding...',
        'added': 'Added',
        'close': 'Close',
        'user_added': 'User successfully added to store',
        'error_adding': 'Failed to add user',
        'has_access': 'Has access'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&storeId=${storeId}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Add user to store
  const addUserToStore = async (userId: string) => {
    setAddingUser(userId);
    setError('');
    
    try {
      const response = await fetch('/api/stores/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, storeId, role: 'KASIR' }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add user');
      }
      
      // Update search results to reflect the change
      setSearchResults(results => 
        results.map(user => 
          user.id === userId 
            ? { ...user, hasAccess: true } 
            : user
        )
      );
      
      // Notify parent component
      onUserAdded();
    } catch (err: any) {
      console.error('Error adding user:', err);
      setError(t('error_adding'));
    } finally {
      setAddingUser(null);
    }
  };

  // Handle search on enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-3 border-brutalism-black shadow-brutal rounded-md w-full max-w-md p-6 relative animate-fade-in">
        <button 
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="flex items-center mb-6">
          <div className="h-12 w-12 bg-brutalism-blue text-white flex items-center justify-center rounded-full border-2 border-brutalism-black shadow-brutal-xs">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold ml-4">{t('search_users')}</h2>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4 relative">
          <div className="flex">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('search_placeholder')}
                className="w-full p-3 pl-10 border-2 border-brutalism-black shadow-brutal-xs"
              />
            </div>
            <button
              onClick={handleSearch}
              className="ml-2 px-4 py-2 bg-brutalism-blue text-white border-2 border-brutalism-black shadow-brutal-xs hover:bg-blue-700"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
        
        <div className="mt-4 max-h-60 overflow-y-auto border-2 border-brutalism-black rounded-md">
          {loading ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-brutalism-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {searchResults.map(user => (
                <div key={user.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{user.name || user.username}</p>
                    <p className="text-sm text-gray-500">{user.username}</p>
                  </div>
                  {user.hasAccess ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md border border-green-300">
                      {t('has_access')}
                    </span>
                  ) : (
                    <button
                      onClick={() => addUserToStore(user.id)}
                      disabled={addingUser === user.id}
                      className="px-3 py-1 bg-brutalism-blue text-white text-sm font-medium rounded-md border-2 border-brutalism-black shadow-brutal-xs hover:bg-blue-700"
                    >
                      {addingUser === user.id ? t('adding') : t('add_user')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? t('no_results') : 'Search for users'}
            </div>
          )}
        </div>
        
        <div className="mt-4 text-right">
          <button
            onClick={onCancel}
            className="px-4 py-2 border-2 border-brutalism-black shadow-brutal-xs bg-white hover:bg-gray-100"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickLoginForm = ({ onCancel, storeId, currentUser }: QuickLoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoAddingUser, setAutoAddingUser] = useState(false);
  const { setManualLoading } = useLoading();
  const settings = useSettings();
  const router = useRouter();
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  // For cashier selection feature
  const [cashiers, setCashiers] = useState<CashierUser[]>([]);
  const [loadingCashiers, setLoadingCashiers] = useState(true);
  const [selectedCashier, setSelectedCashier] = useState<CashierUser | null>(null);
  const [showCashierSelector, setShowCashierSelector] = useState(true); // Start with cashier selector

  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'username': 'Nama Pengguna',
        'password': 'Kata Sandi',
        'login': 'Masuk',
        'cancel': 'Batal',
        'login_to_continue': 'Masuk untuk melanjutkan',
        'invalid_credentials': 'Kata sandi salah',
        'no_access': 'Pengguna tidak memiliki akses ke toko ini',
        'add_user_first': 'Tambahkan pengguna ke toko terlebih dahulu',
        'add_new_user': 'Tambah Pengguna Baru',
        'failed_to_add_user': 'Gagal menambahkan pengguna ke toko',
        'login_failed_after_add': 'Gagal masuk setelah menambahkan ke toko',
        'auto_adding_user': 'Menambahkan pengguna ke toko secara otomatis...',
        'select_cashier': 'Pilih Kasir',
        'available_cashiers': 'Daftar Kasir Tersedia',
        'no_cashiers': 'Tidak ada kasir tersedia',
        'enter_password': 'Masukkan Kata Sandi',
        'back_to_list': 'Kembali ke Daftar',
        'select_cashier_first': 'Pilih kasir terlebih dahulu',
        'wrong_password': 'Kata sandi salah',
        'loading_cashiers': 'Memuat daftar kasir...',
        'switch_user': 'Ganti Kasir',
        'current_user': 'Kasir Saat Ini'
      },
      'en': {
        'username': 'Username',
        'password': 'Password',
        'login': 'Login',
        'cancel': 'Cancel',
        'login_to_continue': 'Login to continue',
        'invalid_credentials': 'Incorrect password',
        'no_access': 'User does not have access to this store',
        'add_user_first': 'Add user to store first',
        'add_new_user': 'Add New User',
        'failed_to_add_user': 'Failed to add user to store',
        'login_failed_after_add': 'Login failed after adding to store',
        'auto_adding_user': 'Automatically adding user to store...',
        'select_cashier': 'Select Cashier',
        'available_cashiers': 'Available Cashiers',
        'no_cashiers': 'No cashiers available',
        'enter_password': 'Enter Password',
        'back_to_list': 'Back to List',
        'select_cashier_first': 'Please select a cashier first',
        'wrong_password': 'Incorrect password',
        'loading_cashiers': 'Loading cashiers...',
        'switch_user': 'Switch Cashier',
        'current_user': 'Current Cashier'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };

  // Fetch available cashiers when component mounts
  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    setLoadingCashiers(true);
    try {
      const response = await fetch(`/api/users?storeId=${storeId}&role=KASIR`);
      if (!response.ok) {
        throw new Error('Failed to fetch cashiers');
      }
      
      const data = await response.json();
      if (data.success) {
        setCashiers(data.users);
      } else {
        throw new Error(data.error || 'Failed to fetch cashiers');
      }
    } catch (error) {
      console.error('Error loading cashiers:', error);
      setError('Failed to load cashiers list');
    } finally {
      setLoadingCashiers(false);
    }
  };

  const selectCashier = (cashier: CashierUser) => {
    setSelectedCashier(cashier);
    setUsername(cashier.username);
    setShowCashierSelector(false);
  };

  const backToCashierList = () => {
    setSelectedCashier(null);
    setUsername('');
    setPassword('');
    setError('');
    setShowCashierSelector(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCashier) {
      setError(t('select_cashier_first'));
      return;
    }
    
    setError('');
    setLoading(true);
    setManualLoading(true);
    console.log('Login attempt started for user:', username);

    try {
      // Attempt login with username and password
      console.log('Attempting login with storeId:', storeId);
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, storeId }),
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      // If login successful, save user and reload
      if (response.ok) {
        console.log('Login successful, saving user data');
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        window.location.reload();
        return;
      }

      // Handle different error cases
      if (response.status === 401) {
        // Invalid credentials
        setError(t('invalid_credentials'));
      } else if (response.status === 403) {
        // No store access
        setError(t('no_access'));
        setAutoAddingUser(true);
        
        // Try to add user to the store
        await handleAutoAddUser();
      } else {
        // Other errors
        throw new Error(data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login process error:', err);
      setError(err.message || t('invalid_credentials'));
    } finally {
      setLoading(false);
      setManualLoading(false);
      setAutoAddingUser(false);
    }
  };
  
  const handleAutoAddUser = async () => {
    try {
      // Verify the credentials are valid by trying login without storeId
      console.log('Verifying credentials without storeId');
      const verifyResponse = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      console.log('Verify response status:', verifyResponse.status);
      if (!verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('Verify response data:', verifyData);
        throw new Error(verifyData.message || t('invalid_credentials'));
      }

      // Credentials are valid, get the user data
      const verifyData = await verifyResponse.json();
      console.log('User verified successfully, user ID:', verifyData.user.id);
      
      // Check if user already has access to this store
      console.log('Checking if user already has access to store:', storeId);
      console.log('User stores data:', verifyData.user.storeId);
      
      // Add the user to the store
      console.log('Adding user to store, storeId:', storeId, 'userId:', verifyData.user.id);
      try {
        const addUserResponse = await fetch('/api/stores/add-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: verifyData.user.id,
            storeId,
            role: 'KASIR',
            setAsDefault: true
          }),
        });
        
        console.log('Add user response status:', addUserResponse.status);
        const addUserData = await addUserResponse.json();
        console.log('Add user response data:', addUserData);
        
        if (!addUserResponse.ok) {
          throw new Error(addUserData.message || t('failed_to_add_user'));
        }
        
        console.log('User added to store successfully, waiting before retrying login');
        
        // Add a delay to ensure the backend has processed the user addition
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Delay completed, now verifying user access to store');
        
        // Verify that the user now has access to the store before retrying login
        const verifyStoreAccess = await fetch(`/api/check-users?userId=${verifyData.user.id}&storeId=${storeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (verifyStoreAccess.ok) {
          const userData = await verifyStoreAccess.json();
          console.log('User data after adding to store:', userData);
          
          // Check if user has access to the store
          const hasStoreAccess = userData.user.hasAccessToRequestedStore;
          console.log('User has access to store after addition:', hasStoreAccess);
          
          if (!hasStoreAccess) {
            console.log('WARNING: User still does not have access to store after addition');
            // Try adding user to store one more time with increased delay
            console.log('Attempting to add user to store again...');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await fetch('/api/stores/add-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: verifyData.user.id,
                storeId,
                role: 'KASIR',
                setAsDefault: true
              }),
            });
            
            // Wait longer this time
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } else {
          console.log('Failed to verify user access to store:', await verifyStoreAccess.text());
        }
        
        console.log('Now retrying login with storeId');
        
        // Retry the login now that the user has access
        const retryResponse = await fetch('/api/auth/simple-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, storeId }),
        });
        
        console.log('Retry login response status:', retryResponse.status);
        const retryData = await retryResponse.json();
        console.log('Retry login response data:', retryData);
        
        if (!retryResponse.ok) {
          throw new Error(retryData.message || t('login_failed_after_add'));
        }
        
        // Success! Save user to localStorage
        console.log('Login successful after adding user to store');
        localStorage.setItem('currentUser', JSON.stringify(retryData.user));
        
        // Refresh the page to update context
        window.location.reload();
        return;
      } catch (addUserErr: any) {
        console.error('Error adding user:', addUserErr);
        setError(addUserErr.message || t('failed_to_add_user'));
      }
    } catch (err: any) {
      console.error('Error in auto-add process:', err);
      setError(err.message || t('failed_to_add_user'));
    }
  };

  const handleUserAdded = () => {
    // Show success message or update UI
    setError(''); // Clear any previous errors
  };

  if (showUserSearch) {
    return <UserSearch onCancel={() => setShowUserSearch(false)} storeId={storeId} onUserAdded={handleUserAdded} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-3 border-brutalism-black shadow-brutal rounded-md w-full max-w-md p-6 relative animate-fade-in">
        <button 
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        {showCashierSelector ? (
          // Cashier selection view
          <>
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-brutalism-blue text-white flex items-center justify-center rounded-full border-2 border-brutalism-black shadow-brutal-xs">
                <User size={24} />
              </div>
              <h2 className="text-2xl font-bold ml-4">{t('select_cashier')}</h2>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{t('available_cashiers')}</h3>
              {loadingCashiers ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-brutalism-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p>{t('loading_cashiers')}</p>
                </div>
              ) : cashiers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 border-2 border-gray-200 rounded-md">
                  {t('no_cashiers')}
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border-2 border-brutalism-black rounded-md">
                  <div className="divide-y divide-gray-200">
                    {cashiers.map(cashier => (
                      <div 
                        key={cashier.id} 
                        className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                        onClick={() => selectCashier(cashier)}
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-brutalism-yellow text-black flex items-center justify-center rounded-full border-2 border-brutalism-black shadow-brutal-xs font-bold">
                            {cashier.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{cashier.name}</p>
                            <p className="text-sm text-gray-500">{cashier.username}</p>
                          </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              {(currentUser?.role === 'ADMIN') && (
                <button
                  type="button"
                  onClick={() => setShowUserSearch(true)}
                  className="px-4 py-2 flex items-center border-2 border-brutalism-black shadow-brutal-xs bg-brutalism-yellow hover:bg-yellow-400"
                >
                  <UserPlus size={18} className="mr-2" />
                  {t('add_new_user')}
                </button>
              )}
              {(currentUser?.role !== 'ADMIN') && (
                <div></div> // Empty div to maintain layout when button is hidden
              )}
              
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border-2 border-brutalism-black shadow-brutal-xs bg-white hover:bg-gray-100"
              >
                {t('cancel')}
              </button>
            </div>
          </>
        ) : (
          // Password entry view
          <>
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-brutalism-yellow text-black flex items-center justify-center rounded-full border-2 border-brutalism-black shadow-brutal-xs font-bold">
                {selectedCashier?.name.charAt(0)}
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold">{selectedCashier?.name}</h2>
                <p className="text-sm text-gray-500">{selectedCashier?.username}</p>
              </div>
            </div>
            
            {error && (
              <div className={`mb-4 p-3 ${autoAddingUser ? 'bg-yellow-100 border-2 border-yellow-400 text-yellow-800' : 'bg-red-100 border-2 border-red-400 text-red-700'} rounded-md`}>
                {autoAddingUser && (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    {error}
                  </div>
                )}
                {!autoAddingUser && error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block font-medium mb-2" htmlFor="password">
                  {t('password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border-2 border-brutalism-black shadow-brutal-xs"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={backToCashierList}
                  className="px-4 py-2 flex items-center border-2 border-brutalism-black shadow-brutal-xs bg-white hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  {t('back_to_list')}
                </button>
                
                <button
                  type="submit"
                  className="px-4 py-2 bg-brutalism-blue text-white border-2 border-brutalism-black shadow-brutal-xs hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (autoAddingUser ? t('auto_adding_user') : '...') : t('login')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const QuickUserSwitch = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { currentStore } = useStore();
  const settings = useSettings();
  
  // Get current user from local storage
  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'username': 'Nama Pengguna',
        'password': 'Kata Sandi',
        'login': 'Masuk',
        'cancel': 'Batal',
        'login_to_continue': 'Masuk untuk melanjutkan',
        'invalid_credentials': 'Kata sandi salah',
        'no_access': 'Pengguna tidak memiliki akses ke toko ini',
        'add_user_first': 'Tambahkan pengguna ke toko terlebih dahulu',
        'add_new_user': 'Tambah Pengguna Baru',
        'failed_to_add_user': 'Gagal menambahkan pengguna ke toko',
        'login_failed_after_add': 'Gagal masuk setelah menambahkan ke toko',
        'auto_adding_user': 'Menambahkan pengguna ke toko secara otomatis...',
        'select_cashier': 'Pilih Kasir',
        'available_cashiers': 'Daftar Kasir Tersedia',
        'no_cashiers': 'Tidak ada kasir tersedia',
        'enter_password': 'Masukkan Kata Sandi',
        'back_to_list': 'Kembali ke Daftar',
        'select_cashier_first': 'Pilih kasir terlebih dahulu',
        'wrong_password': 'Kata sandi salah',
        'loading_cashiers': 'Memuat daftar kasir...',
        'switch_user': 'Ganti Kasir',
        'current_user': 'Kasir Saat Ini'
      },
      'en': {
        'username': 'Username',
        'password': 'Password',
        'login': 'Login',
        'cancel': 'Cancel',
        'login_to_continue': 'Login to continue',
        'invalid_credentials': 'Incorrect password',
        'no_access': 'User does not have access to this store',
        'add_user_first': 'Add user to store first',
        'add_new_user': 'Add New User',
        'failed_to_add_user': 'Failed to add user to store',
        'login_failed_after_add': 'Login failed after adding to store',
        'auto_adding_user': 'Automatically adding user to store...',
        'select_cashier': 'Select Cashier',
        'available_cashiers': 'Available Cashiers',
        'no_cashiers': 'No cashiers available',
        'enter_password': 'Enter Password',
        'back_to_list': 'Back to List',
        'select_cashier_first': 'Please select a cashier first',
        'wrong_password': 'Incorrect password',
        'loading_cashiers': 'Loading cashiers...',
        'switch_user': 'Switch Cashier',
        'current_user': 'Current Cashier'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser) return "?";
    
    if (currentUser.name) {
      const nameParts = currentUser.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`;
      }
      return currentUser.name[0];
    }
    
    return currentUser.username[0].toUpperCase();
  };

  if (!currentStore) return null;

  return (
    <>
      <div className="flex items-center p-3 bg-white border-3 border-brutalism-black shadow-brutal-sm rounded-md mb-4">
        <div className="flex items-center flex-1">
          <div className="h-10 w-10 rounded-full bg-brutalism-blue text-white flex items-center justify-center font-bold border-2 border-brutalism-black shadow-brutal-xs">
            {getUserInitials()}
          </div>
          <div className="ml-3">
            <p className="text-xs text-gray-600">{t('current_user')}</p>
            <p className="font-medium">{currentUser?.name || currentUser?.username}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowLoginModal(true)}
          className="ml-4 flex items-center px-3 py-2 bg-white border-2 border-brutalism-black shadow-brutal-xs hover:bg-gray-100"
        >
          <UserCircle size={18} className="mr-2" />
          {t('switch_user')}
        </button>
      </div>
      
      {showLoginModal && currentStore && (
        <QuickLoginForm 
          onCancel={() => setShowLoginModal(false)}
          storeId={currentStore.id}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default QuickUserSwitch; 