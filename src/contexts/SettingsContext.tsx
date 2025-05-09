'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from './StoreContext';

export type Theme = 'light' | 'dark' | 'blue' | 'green' | 'yellow' | 'red';
export type FontSize = 'small' | 'medium' | 'large';
export type Language = 'id' | 'en';

interface SettingsContextType {
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setLanguage: (lang: Language) => void;
  saveSettings: () => Promise<boolean>;
}

const defaultSettings: Omit<SettingsContextType, 'setTheme' | 'setFontSize' | 'setLanguage' | 'saveSettings'> = {
  theme: 'blue',
  fontSize: 'medium',
  language: 'id',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { currentStore } = useStore();
  
  const [settings, setSettings] = useState({
    theme: defaultSettings.theme,
    fontSize: defaultSettings.fontSize,
    language: defaultSettings.language,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      // Load from localStorage first (for SSR compatibility)
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsedSettings,
          }));
        } catch (error) {
          console.error('Failed to parse stored settings:', error);
        }
      }
    };
    
    loadSettings();
  }, []);
  
  // Fetch store-specific settings when store changes
  useEffect(() => {
    const fetchStoreSettings = async () => {
      if (currentStore?.id) {
        try {
          const response = await fetch(`/api/settings?storeId=${currentStore.id}`);
          
          if (!response.ok) {
            console.error('Error fetching store settings: Server responded with status', response.status);
            return;
          }
          
          const data = await response.json();
          const storeSettings: Record<string, string> = {};
          
          // Convert array of settings to object
          data.settings?.forEach((setting: { key: string, value: string }) => {
            storeSettings[setting.key] = setting.value;
          });
          
          // Update settings with store-specific settings
          setSettings(prev => ({
            ...prev,
            theme: (storeSettings.theme as Theme) || prev.theme,
            fontSize: (storeSettings.fontSize as FontSize) || prev.fontSize,
            language: (storeSettings.language as Language) || prev.language,
          }));
          
          // Save merged settings to localStorage
          localStorage.setItem('appSettings', JSON.stringify({
            ...settings,
            theme: (storeSettings.theme as Theme) || settings.theme,
            fontSize: (storeSettings.fontSize as FontSize) || settings.fontSize,
            language: (storeSettings.language as Language) || settings.language,
          }));
        } catch (error) {
          console.error('Error fetching store settings:', error);
        }
      }
    };
    
    fetchStoreSettings();
  }, [currentStore]);

  // Apply theme and font size when they change
  useEffect(() => {
    // Apply theme
    if (typeof document !== 'undefined') {
      // Remove all theme classes from both html and body
      document.documentElement.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'yellow-theme', 'red-theme');
      document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'yellow-theme', 'red-theme');
      
      // Add the selected theme class to body
      document.body.classList.add(`${settings.theme}-theme`);
      
      // Also set a data attribute on the html element for additional CSS targeting
      document.documentElement.setAttribute('data-theme', settings.theme);
      
      // Apply font size
      document.documentElement.dataset.fontSize = settings.fontSize;
      
      // Update HTML lang attribute
      document.documentElement.lang = settings.language;
      
      // Store settings in localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      console.log(`Theme applied: ${settings.theme}-theme`);
    }
  }, [settings]);

  const setTheme = (theme: Theme) => {
    console.log(`Setting theme to: ${theme}`);
    setSettings(prev => ({ ...prev, theme }));
  };

  const setFontSize = (fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const setLanguage = (language: Language) => {
    // Update state
    setSettings(prev => ({ ...prev, language }));
    
    // Set cookie for Next.js i18n
    document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000`;
    
    // Update HTML lang attribute
    document.documentElement.lang = language;
  };

  const saveSettings = async (): Promise<boolean> => {
    try {
      // Check if we have a store ID
      if (!currentStore?.id) {
        console.error('No store selected');
        return false;
      }
      
      // Determine if we should save to store or globally
      const settingsToSave = {
        theme: settings.theme,
        fontSize: settings.fontSize,
        language: settings.language,
      };
      
      const requestData = { 
        settings: settingsToSave, 
        storeId: currentStore.id 
      };
      
      // Save to API
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to save settings:', data.error || response.statusText);
        throw new Error('Failed to save settings');
      }
      
      // Save to localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // If language changed, reload the page to apply new language
      const storedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
      if (storedSettings.language !== settings.language) {
        // Instead of using router.push which doesn't work correctly with i18n,
        // reload the page to apply the new language settings
        window.location.reload();
      }
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setTheme,
        setFontSize,
        setLanguage,
        saveSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 