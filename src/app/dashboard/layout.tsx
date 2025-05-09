"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { 
  Home, 
  PackageOpen, 
  ShoppingCart, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  BarChart3,
  Tag,
  CreditCard,
  UserCircle,
  Store
} from "lucide-react";
import LogoutButton from "../../components/LogoutButton";
import { useSettings } from "@/contexts/SettingsContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useLoading } from "@/contexts/LoadingContext";
import { useStore } from '@/contexts/StoreContext';
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "KASIR" | "SUPER_ADMIN";
  stores?: { role: "ADMIN" | "KASIR" | "SUPER_ADMIN" }[];
}

// Create a context for the sidebar state
const SidebarContext = createContext<{
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

// Create a wrapper component for sidebar links
const SidebarLink = ({ href, icon, label, isActiveFn }: { href: string, icon: React.ReactNode, label: string, isActiveFn: (path: string) => boolean }) => {
  const { setManualLoading } = useLoading();
  const isActive = isActiveFn(href);
  const { setSidebarOpen } = useContext(SidebarContext);
  
  const handleClick = () => {
    // Only set loading if we're navigating to a new page
    if (!isActive) {
      // Set loading to true when link is clicked
      setManualLoading(true);
      
      // Close sidebar on mobile
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      
      // Reset loading after a short delay if navigation gets stuck
      setTimeout(() => {
        setManualLoading(false);
      }, 2000);
    }
  };
  
  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`sidebar-link flex items-center p-2 rounded-md font-medium 
        ${isActive 
          ? 'bg-white text-brutalism-blue border-2 border-brutalism-black shadow-brutal-sm transform -translate-y-1' 
          : 'hover:bg-gray-100 hover:border-2 hover:border-brutalism-black hover:shadow-brutal-xs transition-all duration-200'
        }`}
      data-active={isActive}
    >
      {icon} <span className="ml-1">{label}</span>
    </Link>
  );
};

// Component to use the LoadingContext
function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const settings = useSettings();
  const { setManualLoading } = useLoading();
  const { currentStore } = useStore();
  const router = useRouter();

  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'app_name': 'POS Vougher',
        'app_tagline': 'Sistem Kasir Modern',
        'dashboard': 'Dashboard',
        'products': 'Produk',
        'categories': 'Kategori',
        'pos': 'Kasir / POS',
        'transactions': 'Transaksi',
        'reports': 'Laporan',
        'invoices': 'Faktur',
        'users': 'Pengguna',
        'settings': 'Pengaturan',
        'loading': 'Memuat...',
        'guest': 'Tamu',
        'admin': 'Administrator',
        'cashier': 'Kasir'
      },
      'en': {
        'app_name': 'POS Vougher',
        'app_tagline': 'Modern POS System',
        'dashboard': 'Dashboard',
        'products': 'Products',
        'categories': 'Categories',
        'pos': 'Point of Sale',
        'transactions': 'Transactions',
        'reports': 'Reports',
        'invoices': 'Invoices',
        'users': 'Users',
        'settings': 'Settings',
        'loading': 'Loading...',
        'guest': 'Guest',
        'admin': 'Administrator',
        'cashier': 'Cashier'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };

  // Function to check if current path matches link path
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  }

  useEffect(() => {
    // Get user from localStorage instead of API
    const getUserFromLocalStorage = () => {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          setCurrentUser(user);

          // Check if current store is active
          const currentStoreId = localStorage.getItem('currentStoreId');
          if (currentStoreId) {
            const isSuperAdmin = user.role === 'SUPER_ADMIN' || 
                                user.stores?.some((store: any) => store.role === 'SUPER_ADMIN');
            
            // If not a super admin, check store status
            if (!isSuperAdmin) {
              fetch(`/api/stores/${currentStoreId}/status`)
                .then(response => response.json())
                .then(data => {
                  if (!data.isActive) {
                    // Store is inactive and user is not a super admin, redirect to login
                    toast.error('The store you are trying to access is inactive');
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentStoreId');
                    router.push('/login');
                  }
                })
                .catch(error => {
                  console.error('Error checking store status:', error);
                });
            }
          }
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
      setLoading(false);
    };

    getUserFromLocalStorage();

    // Add event listener for storage changes (in case of logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue);
            setCurrentUser(user);
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  // Set sidebar open by default on desktop, closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Determine if user is super admin - server-side compatible check
  const [isLocalSuperAdmin, setIsLocalSuperAdmin] = useState(false);
  
  // Base super admin check without localStorage to avoid hydration mismatch
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || 
                       currentUser?.stores?.some((store: any) => store.role === 'SUPER_ADMIN') ||
                       isLocalSuperAdmin;
  
  // Check localStorage after component mounts (client-side only)
  useEffect(() => {
    // Check for superadmin flag in localStorage
    const superAdminFlag = localStorage.getItem('isSuperAdmin') === 'true';
    if (superAdminFlag) {
      setIsLocalSuperAdmin(true);
    }
  }, []);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="flex h-screen bg-background overflow-hidden">
        <LoadingIndicator />
        
        {/* Mobile header */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-white z-40 md:hidden border-b-3 border-brutalism-black flex items-center shadow-brutal-sm">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-12 h-12 flex items-center justify-center mx-1"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
          <h1 className="text-lg font-bold flex-1 text-center">
            {currentStore?.name || 'POS Vougher'}
          </h1>
          
          <div className="h-8 w-8 rounded-full bg-brutalism-blue text-white flex items-center justify-center font-bold border-2 border-brutalism-black shadow-brutal-xs">
            {getUserInitials()}
          </div>
        </div>
        
        {/* Mobile overlay - positioned BEHIND the sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}
        
        {/* Sidebar - now has higher z-index than overlay */}
        <div 
          className={`md:w-64 fixed md:static z-30 transition-all duration-300 ${
            sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:translate-x-0 md:w-64'
          } bg-white border-r-3 border-brutalism-black h-full overflow-hidden`}
          style={{ 
            top: '56px', 
            height: 'calc(100vh - 0)', 
            maxHeight: '100vh'
          }}
        >
          <div className="p-4 border-b-3 border-brutalism-black bg-brutalism-yellow md:flex hidden">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-brutalism-black">{currentStore?.name || 'POS Vougher'}</h1>
              <p className="text-sm text-brutalism-black">{t('app_tagline')}</p>
            </div>
          </div>
          <nav className="p-3 overflow-y-auto" style={{ height: 'calc(100% - 74px)' }}>
            <ul className="space-y-2">
              {isSuperAdmin ? (
                // Super Admin menu - only Settings and Store Management
                <>
                  <li>
                    <SidebarLink 
                      href="/dashboard" 
                      icon={<Home className="w-5 h-5 mr-2" />} 
                      label={t('dashboard')}
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/stores" 
                      icon={<Store className="w-5 h-5 mr-2" />} 
                      label="Store Management"
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/pengaturan" 
                      icon={<Settings className="w-5 h-5 mr-2" />} 
                      label={t('settings')}
                      isActiveFn={isActive}
                    />
                  </li>
                </>
              ) : (
                // Regular user menu - all options
                <>
                  <li>
                    <SidebarLink 
                      href="/dashboard" 
                      icon={<Home className="w-5 h-5 mr-2" />} 
                      label={t('dashboard')}
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/products" 
                      icon={<PackageOpen className="w-5 h-5 mr-2" />} 
                      label={t('products')}
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/categories" 
                      icon={<Tag className="w-5 h-5 mr-2" />} 
                      label={t('categories')}
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/pos" 
                      icon={<CreditCard className="w-5 h-5 mr-2" />} 
                      label={t('pos')}
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/transactions" 
                      icon={<ShoppingCart className="w-5 h-5 mr-2" />} 
                      label={t('transactions')}
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/reports" 
                      icon={<BarChart3 className="w-5 h-5 mr-2" />} 
                      label={t('reports')}
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/pengguna" 
                      icon={<Users className="w-5 h-5 mr-2" />} 
                      label={t('users')}
                      isActiveFn={isActive}
                    />
                  </li>
                  <li>
                    <SidebarLink 
                      href="/dashboard/pengaturan" 
                      icon={<Settings className="w-5 h-5 mr-2" />} 
                      label={t('settings')}
                      isActiveFn={isActive}
                    />
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1 w-full md:ml-0 pt-14 md:pt-0 flex flex-col h-screen overflow-hidden">
          {/* Header - desktop only */}
          <header className="hidden md:flex items-center justify-between border-b-3 border-brutalism-black bg-white py-3 px-6 shadow-brutal-sm sticky top-0 z-20">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">
                {pathname === '/dashboard' 
                  ? t('dashboard') 
                  : pathname.split('/').pop() 
                    ? t(pathname.split('/').pop()! as any) || pathname.split('/').pop()!.charAt(0).toUpperCase() + pathname.split('/').pop()!.slice(1)
                    : t('dashboard')
                }
              </h1>
              
              {currentStore && (
                <div className="ml-4 px-3 py-1 bg-brutalism-yellow border-2 border-brutalism-black rounded-md shadow-brutal-xs">
                  <span className="text-sm font-medium">{currentStore.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center p-2 rounded-md border-2 border-brutalism-black shadow-brutal-xs bg-white">
              <div className="h-9 w-9 rounded-full bg-brutalism-blue text-white flex items-center justify-center font-bold border-2 border-brutalism-black shadow-brutal-xs">
                {getUserInitials()}
              </div>
              <div className="ml-3">
                <p className="font-medium text-brutalism-black">{currentUser?.name || t('guest')}</p>
                <p className="text-xs text-gray-600">
                  {!currentUser?.role ? t('user') :
                   currentUser.role.toUpperCase() === "ADMIN" ? t('admin') : 
                   currentUser.role.toUpperCase() === "KASIR" ? t('cashier') : 
                   String(currentUser.role)}
                </p>
              </div>
              <LogoutButton className="ml-4 bg-white hover:bg-brutalism-red hover:text-white border-2 border-brutalism-black shadow-brutal-xs" />
            </div>
          </header>
          
          {/* Mobile page title */}
          <div className="md:hidden px-4 py-3">
            <h1 className="text-xl font-bold">
              {pathname === '/dashboard' 
                ? t('dashboard') 
                : pathname.split('/').pop() 
                  ? t(pathname.split('/').pop()! as any) || pathname.split('/').pop()!.charAt(0).toUpperCase() + pathname.split('/').pop()!.slice(1)
                  : t('dashboard')
              }
            </h1>
            
            {currentStore && (
              <div className="mt-1 inline-block px-2 py-1 bg-brutalism-yellow border-2 border-brutalism-black rounded-md shadow-brutal-xs">
                <span className="text-sm font-medium">{currentStore.name}</span>
              </div>
            )}
          </div>
          
          <div className="container mx-auto p-4 md:p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

// Main layout component with the provider
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <LoadingProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </LoadingProvider>
  );
}