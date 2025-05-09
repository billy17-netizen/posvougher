'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Settings, Monitor, Globe, Save, X } from 'lucide-react';
import type { Theme, FontSize, Language } from '@/contexts/SettingsContext';

// Simple settings page with theme and language options
export default function SettingsPage() {
  // Simple translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'settings': 'Pengaturan',
        'display.title': 'Tampilan',
        'display.theme': 'Tema',
        'display.light': 'Terang',
        'display.dark': 'Gelap',
        'display.fontSize': 'Ukuran Font',
        'display.small': 'Kecil',
        'display.medium': 'Sedang',
        'display.large': 'Besar',
        'language.title': 'Bahasa',
        'language.select': 'Pilih Bahasa',
        'language.indonesian': 'Bahasa Indonesia',
        'language.english': 'Bahasa Inggris',
        'save': 'Simpan',
        'cancel': 'Batal',
        'settings_saved': 'Pengaturan berhasil disimpan',
        'settings_error': 'Gagal menyimpan pengaturan'
      },
      'en': {
        'settings': 'Settings',
        'display.title': 'Display',
        'display.theme': 'Theme',
        'display.light': 'Light',
        'display.dark': 'Dark',
        'display.fontSize': 'Font Size',
        'display.small': 'Small',
        'display.medium': 'Medium',
        'display.large': 'Large',
        'language.title': 'Language',
        'language.select': 'Select Language',
        'language.indonesian': 'Indonesian',
        'language.english': 'English',
        'save': 'Save',
        'cancel': 'Cancel',
        'settings_saved': 'Settings saved successfully',
        'settings_error': 'Failed to save settings'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  const settings = useSettings();
  
  const [currentSettings, setCurrentSettings] = useState({
    theme: settings.theme,
    fontSize: settings.fontSize,
    language: settings.language,
  });

  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check if settings have changed
  useEffect(() => {
    const hasChanged = 
      currentSettings.theme !== settings.theme ||
      currentSettings.fontSize !== settings.fontSize ||
      currentSettings.language !== settings.language;
    
    setIsChanged(hasChanged);
  }, [currentSettings, settings]);

  // Handle settings changes
  const handleThemeChange = (theme: Theme) => {
    setCurrentSettings(prev => ({ ...prev, theme }));
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    setCurrentSettings(prev => ({ ...prev, fontSize }));
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentSettings(prev => ({ ...prev, language }));
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    
    // Update context settings
    settings.setTheme(currentSettings.theme);
    settings.setFontSize(currentSettings.fontSize);
    settings.setLanguage(currentSettings.language);
    
    const success = await settings.saveSettings();
    
    if (success) {
      setSaveMessage({ type: 'success', text: t('settings_saved') });
      
      // Reset message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } else {
      setSaveMessage({ type: 'error', text: t('settings_error') });
    }
    
    setIsSaving(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setCurrentSettings({
      theme: settings.theme,
      fontSize: settings.fontSize,
      language: settings.language,
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Settings className="mr-2 text-brutalism-blue" />
            {t('settings')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('settings')}
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className={`${
          saveMessage.type === 'success' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
        } border-3 p-3 my-4 flex items-center`}>
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Display Settings */}
        <div className="brutalism-card p-0 overflow-hidden">
          <div className="bg-brutalism-blue p-3 text-white font-bold flex items-center">
            <Monitor className="mr-2" /> {t('display.title')}
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">{t('display.theme')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 border-3 border-brutalism-black ${
                    currentSettings.theme === 'light' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-white'
                  }`}
                >
                  {t('display.light')}
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 border-3 border-brutalism-black ${
                    currentSettings.theme === 'dark' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-gray-800 text-white'
                  }`}
                >
                  {t('display.dark')}
                </button>
                <button
                  onClick={() => handleThemeChange('blue')}
                  className={`p-4 border-3 border-brutalism-black ${
                    currentSettings.theme === 'blue' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-brutalism-blue text-white'
                  }`}
                >
                  {t('blue') || 'Blue'}
                </button>
                <button
                  onClick={() => handleThemeChange('green')}
                  className={`p-4 border-3 border-brutalism-black ${
                    currentSettings.theme === 'green' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-brutalism-green'
                  }`}
                >
                  {t('green') || 'Green'}
                </button>
                <button
                  onClick={() => handleThemeChange('yellow')}
                  className={`p-4 border-3 border-brutalism-black ${
                    currentSettings.theme === 'yellow' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-brutalism-yellow'
                  }`}
                >
                  {t('yellow') || 'Yellow'}
                </button>
                <button
                  onClick={() => handleThemeChange('red')}
                  className={`p-4 border-3 border-brutalism-black ${
                    currentSettings.theme === 'red' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-brutalism-red'
                  }`}
                >
                  {t('red') || 'Red'}
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-2">{t('display.fontSize')}</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleFontSizeChange('small')}
                  className={`flex-1 p-4 border-3 border-brutalism-black ${
                    currentSettings.fontSize === 'small' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-white'
                  } text-sm`}
                >
                  {t('display.small')}
                </button>
                <button
                  onClick={() => handleFontSizeChange('medium')}
                  className={`flex-1 p-4 border-3 border-brutalism-black ${
                    currentSettings.fontSize === 'medium' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-white'
                  } text-base`}
                >
                  {t('display.medium')}
                </button>
                <button
                  onClick={() => handleFontSizeChange('large')}
                  className={`flex-1 p-4 border-3 border-brutalism-black ${
                    currentSettings.fontSize === 'large' 
                      ? 'bg-brutalism-yellow shadow-brutal-sm' 
                      : 'bg-white'
                  } text-lg`}
                >
                  {t('display.large')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="brutalism-card p-0 overflow-hidden">
          <div className="bg-brutalism-green p-3 text-white font-bold flex items-center">
            <Globe className="mr-2" /> {t('language.title')}
          </div>
          <div className="p-6">
            <h3 className="font-medium text-lg mb-2">{t('language.select')}</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => handleLanguageChange('id')}
                className={`flex-1 p-4 border-3 border-brutalism-black ${
                  currentSettings.language === 'id' 
                    ? 'bg-brutalism-yellow shadow-brutal-sm' 
                    : 'bg-white'
                }`}
              >
                {t('language.indonesian')}
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 p-4 border-3 border-brutalism-black ${
                  currentSettings.language === 'en' 
                    ? 'bg-brutalism-yellow shadow-brutal-sm' 
                    : 'bg-white'
                }`}
              >
                {t('language.english')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        <button
          onClick={handleSave}
          disabled={!isChanged || isSaving}
          className={`btn btn-primary flex items-center ${
            !isChanged || isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {t('save')}...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" /> {t('save')}
            </>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={!isChanged || isSaving}
          className={`btn btn-secondary flex items-center ${
            !isChanged || isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <X size={16} className="mr-2" /> {t('cancel')}
        </button>
      </div>
    </div>
  );
} 