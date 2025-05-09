'use client';

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";

interface ClientLayoutProps {
  children: React.ReactNode;
  interVariable: string;
  geistSansVariable: string;
  geistMonoVariable: string;
}

export default function ClientLayout({ 
  children, 
  interVariable, 
  geistSansVariable, 
  geistMonoVariable 
}: ClientLayoutProps) {
  // Use state to handle language to avoid hydration mismatch
  const [lang, setLang] = useState('id');
  const pathname = usePathname();
  
  // Determine page type for styling purposes
  const pageType = pathname?.startsWith('/dashboard') ? 'dashboard' : 'regular';

  // Only run on client side after initial render
  useEffect(() => {
    try {
      const appSettings = localStorage.getItem('appSettings');
      if (appSettings) {
        const settings = JSON.parse(appSettings);
        if (settings && settings.language) {
          setLang(settings.language);
          
          // Set cookie for Next.js i18n
          document.cookie = 'NEXT_LOCALE=' + settings.language + '; path=/; max-age=31536000';
        }
      }
    } catch (e) {
      console.error('Error setting language:', e);
    }
  }, []);

  return (
    <html lang={lang} className={`${interVariable} ${geistSansVariable} ${geistMonoVariable}`} data-page={pageType}>
      <body className={`min-h-screen bg-background font-sans ${pageType === 'dashboard' ? 'dashboard' : ''}`}>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              border: '3px solid #000',
              padding: '16px',
              color: '#000',
              borderRadius: '8px',
            },
            success: {
              style: {
                background: '#ecfdf5',
                borderColor: '#10b981',
              },
            },
            error: {
              style: {
                background: '#fef2f2',
                borderColor: '#ef4444',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
} 