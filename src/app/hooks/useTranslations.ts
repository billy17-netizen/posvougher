import { useCallback, useEffect, useState } from 'react';
import { getUserLanguage, getTranslation, Language } from '../i18n';

/**
 * A hook for client-side translations
 */
export function useTranslations() {
  const [language, setLanguage] = useState<Language>('id');
  
  // Initialize on client-side only
  useEffect(() => {
    setLanguage(getUserLanguage());
  }, []);
  
  // Translation function
  const t = useCallback((key: string): string => {
    return getTranslation(language, key);
  }, [language]);
  
  // Function to change language
  const changeLanguage = useCallback((newLang: Language) => {
    if (newLang === 'en' || newLang === 'id') {
      setLanguage(newLang);
      try {
        // Save in settings
        const settingsJson = localStorage.getItem('appSettings');
        const settings = settingsJson ? JSON.parse(settingsJson) : {};
        settings.language = newLang;
        localStorage.setItem('appSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  }, []);
  
  return {
    t,
    language,
    changeLanguage
  };
} 