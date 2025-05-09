"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call the logout API
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      // Clear all relevant data from localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentStoreId');
      localStorage.removeItem('currentStoreName');
      
      // Clear cookies
      document.cookie = 'currentStoreId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      console.log('Logged out successfully, cleared all data');
      
      // Redirect to login page - use window.location for a full page reload
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local storage anyway for security
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentStoreId');
      localStorage.removeItem('currentStoreName');
      
      // Clear cookies
      document.cookie = 'currentStoreId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // For simplicity, we'll still redirect to login even if logout fails
      window.location.href = "/login";
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