'use client';

import React from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { useSettings } from '@/contexts/SettingsContext';

export default function LoadingIndicator() {
  const { isLoading } = useLoading();
  const settings = useSettings();
  
  // Simple translation function
  const t = (key: string) => {
    const lang = settings.language;
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'loading': 'Memuat...',
      },
      'en': {
        'loading': 'Loading...',
      }
    };
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className="h-full bg-brutalism-blue animate-pulse"></div>
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-brutalism-yellow px-3 py-1 rounded-full shadow-brutal-sm border-2 border-brutalism-black">
        <span className="text-xs font-medium flex items-center">
          {t('loading')}
          <span className="ml-1 inline-block">
            <span className="animate-bounce inline-block">.</span>
            <span className="animate-bounce inline-block delay-100">.</span>
            <span className="animate-bounce inline-block delay-200">.</span>
          </span>
        </span>
      </div>
    </div>
  );
} 