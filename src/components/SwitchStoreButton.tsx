"use client";

import { Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SwitchStoreButtonProps {
  className?: string;
}

export default function SwitchStoreButton({ className = "" }: SwitchStoreButtonProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchStore = async () => {
    try {
      setIsSwitching(true);
      
      // Clear only store-related data
      localStorage.removeItem('currentStoreId');
      localStorage.removeItem('currentStoreName');
      
      // Clear store cookie
      document.cookie = 'currentStoreId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      console.log('Cleared store data, redirecting to store selection');
      
      // Redirect to stores page - use window.location for a full page reload
      window.location.href = "/stores";
    } catch (error) {
      console.error("Error switching store:", error);
      // Still redirect to stores page even if there's an error
      window.location.href = "/stores";
    }
  };

  return (
    <button
      onClick={handleSwitchStore}
      disabled={isSwitching}
      className={`flex items-center justify-center px-2 py-1 rounded-md text-sm ${className}`}
    >
      <Store className="w-4 h-4 mr-1" /> 
      <span>{isSwitching ? "..." : "Keluar"}</span>
    </button>
  );
} 