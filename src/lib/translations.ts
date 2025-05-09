/**
 * Simple client-side translation utility
 * This is a temporary solution until proper i18n setup is configured
 */

import { getUserLanguage, getTranslation } from '@/app/i18n';

export function useSimpleTranslation() {
  // Get the appropriate translations based on language
  const t = (key: string): string => {
    return getTranslation(getUserLanguage(), key);
  };
  
  return { t };
} 