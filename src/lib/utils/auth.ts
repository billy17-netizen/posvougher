// Authentication utilities

/**
 * Checks if the user is authenticated based on localStorage
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userJson = localStorage.getItem('currentUser');
  return !!userJson;
};

/**
 * Redirects authenticated users away from public pages like login and landing page
 * Also redirects from /stores if user already has a store selected
 * @param router - Next.js router object
 * @returns {boolean} True if user was redirected
 */
export const redirectAuthenticatedUser = (router: any): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Get current path
  const path = window.location.pathname;
  
  // Check if this is a public page (/, /login, /register)
  const isPublicPage = path === '/' || path === '/login' || path === '/register';
  
  // Check if this is the stores page
  const isStoresPage = path === '/stores' || path.startsWith('/stores/');
  const isStoreCreatePage = path === '/stores/create';
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    const storeId = localStorage.getItem('currentStoreId');
    
    // For public pages, redirect authenticated users
    if (isPublicPage) {
      if (storeId) {
        router.replace('/dashboard');
      } else {
        router.replace('/stores');
      }
      return true;
    }
    
    // Prevent accessing /stores if a store is already selected
    // Skip /stores/create, which should be accessible even with a current store
    if (isStoresPage && !isStoreCreatePage && storeId) {
      router.replace('/dashboard');
      return true;
    }
  }
  
  return false;
};

/**
 * Redirects unauthenticated users to login page
 * @param router - Next.js router object
 * @returns {boolean} True if user was redirected
 */
export const requireAuthentication = (router: any): boolean => {
  if (typeof window === 'undefined') return false;
  
  if (!isAuthenticated()) {
    router.replace('/login');
    return true;
  }
  
  return false;
}; 