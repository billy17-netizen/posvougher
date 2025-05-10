"use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    // Set logout flags to prevent redirection to store page
    localStorage.setItem('force_logout', 'true');
    sessionStorage.setItem('logout_in_progress', 'true');
    
    // Clear localStorage and cookies
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentStoreId');
    localStorage.removeItem('currentStoreName');
    localStorage.removeItem('isSuperAdmin'); // Clear the superadmin flag
    localStorage.removeItem('appSettings');
    
    // Clear cookies
    document.cookie = 'currentStoreId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Call the logout API, but don't wait for it
    fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch(error => {
      console.error("Error during logout API call:", error);
    });
    
    // Redirect directly to login with force_logout parameter
    window.location.href = "/login?force_logout=true";
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-background brutalism-bg brutalism-dots">
      <div className="bg-white p-6 border-3 border-brutalism-black shadow-brutal text-center">
        <h1 className="text-xl font-bold mb-4">Logging Out</h1>
        <p>Please wait, logging you out...</p>
      </div>
    </div>
  );
} 