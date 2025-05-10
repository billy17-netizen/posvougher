"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    try {
      setIsLoggingOut(true);
      
      // Set the logout flag immediately to prevent any redirects
      localStorage.setItem('force_logout', 'true');
      sessionStorage.setItem('logout_in_progress', 'true');
      
      // Go to dedicated logout page which will handle the full logout process
      window.location.href = "/logout";
    } catch (error) {
      console.error("Error initiating logout:", error);
      
      // In case of error, try direct logout
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentStoreId');
      localStorage.removeItem('currentStoreName');
      localStorage.removeItem('isSuperAdmin');
      
      window.location.href = "/login?force_logout=true";
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center justify-center px-2 py-1 rounded-md text-sm ${className}`}
    >
      <LogOut className="w-4 h-4 mr-1" /> 
      <span>{isLoggingOut ? "..." : "Keluar"}</span>
    </button>
  );
} 