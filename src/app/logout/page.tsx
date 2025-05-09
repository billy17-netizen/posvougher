"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear localStorage and cookies
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentStoreId');
    localStorage.removeItem('currentStoreName');
    localStorage.removeItem('isSuperAdmin'); // Clear the superadmin flag
    localStorage.removeItem('appSettings');
    
    // Clear cookies
    document.cookie = 'currentStoreId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Call the logout API
    fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    .finally(() => {
      // Redirect to login page regardless of success/failure
      router.push("/login");
    });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background brutalism-bg brutalism-dots">
      <div className="bg-white p-6 border-3 border-brutalism-black shadow-brutal text-center">
        <h1 className="text-xl font-bold mb-4">Logging Out</h1>
        <p>Please wait, logging you out...</p>
      </div>
    </div>
  );
} 