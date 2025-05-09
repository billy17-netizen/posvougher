// Import English and Indonesian translations
import enTranslations from '../../public/locales/en/common.json';
import idTranslations from '../../public/locales/id/common.json';

export type Language = 'en' | 'id';

// Store translations in memory for quick access
const translations = {
  en: enTranslations,
  id: idTranslations,
};

// This helps TypeScript understand the structure
type TranslationsType = Record<string, any>;

/**
 * Gets a value from a nested object using a dot notation path
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }
  
  return current as string;
}

/**
 * App Router compatible translation function
 */
export function getTranslation(lang: Language = 'id', key: string): string {
  const translationSet: TranslationsType = translations[lang] || translations.id;
  return getNestedValue(translationSet, key) || key;
}

/**
 * Get the user's preferred language
 * Client-side only
 */
export function getUserLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'id'; // Default for server-side
  }
  
  try {
    const settings = localStorage.getItem('appSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed && parsed.language && (parsed.language === 'en' || parsed.language === 'id')) {
        return parsed.language;
      }
    }
  } catch (error) {
    console.error('Error reading language preference:', error);
  }
  
  return 'id'; // Default to Indonesian
} 