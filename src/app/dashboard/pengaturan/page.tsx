"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Settings, Store, Globe, Bell, Lock, CreditCard, Printer, Database, Monitor, Save, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { useStore } from '@/contexts/StoreContext';
import StoreSelector from '@/components/StoreSelector';
import type { Theme, FontSize, Language } from '@/contexts/SettingsContext';
// import { useAppTranslation } from '@/lib/i18n';

interface User {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "KASIR" | "SUPER_ADMIN";
  stores?: { role: "ADMIN" | "KASIR" | "SUPER_ADMIN" }[];
}

interface SettingsState {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  language: string;
  taxRate: string;
  receiptHeader: string;
  receiptFooter: string;
  theme: 'light' | 'dark' | 'blue' | 'green' | 'yellow' | 'red';
  fontSize: 'small' | 'medium' | 'large';
}

export default function PengaturanPage() {
  const router = useRouter();
  const settings = useSettings();
  const { currentStore } = useStore();
  // Use a dynamic translation function that respects the current language
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
        'settings_error': 'Gagal menyimpan pengaturan',
        'general': 'Umum',
        'display_language': 'Tampilan & Bahasa',
        'notifications': 'Notifikasi',
        'security': 'Keamanan',
        'payment': 'Pembayaran',
        'receipt': 'Struk',
        'database': 'Database',
        'categories': 'Kategori',
        'store_name': 'Nama Toko',
        'address': 'Alamat',
        'phone': 'Telepon',
        'email': 'Email',
        'tax_rate': 'Tarif Pajak (%)',
        'saving': 'Menyimpan...',
        'save_settings': 'Simpan Pengaturan',
        'general_settings': 'Pengaturan Umum',
        'database_settings': 'Pengaturan Database',
        'receipt_settings': 'Pengaturan Struk',
        'warning': 'Perhatian!',
        'db_reset_warning': 'Tindakan berikut akan mereset database. Semua data akan dihapus dan tidak dapat dikembalikan.',
        'db_reset': 'Reset Database',
        'db_reset_desc': 'Reset database akan menghapus semua data transaksi dan produk, tetapi akan membuat data default untuk pengujian.',
        'db_backup': 'Backup Database',
        'db_backup_desc': 'Download backup dari database Anda dalam bentuk file JSON.',
        'download_backup': 'Download Backup',
        'header_receipt': 'Header Struk',
        'footer_receipt': 'Footer Struk',
        'currency': 'Mata Uang',
        'theme_options': 'Pilihan Tema',
        'blue': 'Biru',
        'green': 'Hijau',
        'yellow': 'Kuning',
        'red': 'Merah',
        'feature_coming_soon': 'Fitur Segera Hadir',
        'feature_coming_soon_desc': 'Pengaturan {tab} sedang dalam pengembangan dan akan segera tersedia.',
        'notifications_coming_soon': 'Pengaturan notifikasi sedang dalam pengembangan dan akan segera tersedia.',
        'security_coming_soon': 'Pengaturan keamanan sedang dalam pengembangan dan akan segera tersedia.',
        'payment_coming_soon': 'Pengaturan pembayaran sedang dalam pengembangan dan akan segera tersedia.',
        'loading_settings': 'Memuat pengaturan...',
        'reset': 'Reset'
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
        'settings_error': 'Failed to save settings',
        'general': 'General',
        'display_language': 'Display & Language',
        'notifications': 'Notifications',
        'security': 'Security',
        'payment': 'Payment',
        'receipt': 'Receipt',
        'database': 'Database',
        'categories': 'Categories',
        'store_name': 'Store Name',
        'address': 'Address',
        'phone': 'Phone',
        'email': 'Email',
        'tax_rate': 'Tax Rate (%)',
        'saving': 'Saving...',
        'save_settings': 'Save Settings',
        'general_settings': 'General Settings',
        'database_settings': 'Database Settings',
        'receipt_settings': 'Receipt Settings',
        'warning': 'Warning!',
        'db_reset_warning': 'The following actions will reset the database. All data will be deleted and cannot be recovered.',
        'db_reset': 'Reset Database',
        'db_reset_desc': 'Database reset will delete all transaction and product data, but will create default data for testing.',
        'db_backup': 'Database Backup',
        'db_backup_desc': 'Download a backup of your database as a JSON file.',
        'download_backup': 'Download Backup',
        'header_receipt': 'Receipt Header',
        'footer_receipt': 'Receipt Footer',
        'currency': 'Currency',
        'theme_options': 'Theme Options',
        'blue': 'Blue',
        'green': 'Green',
        'yellow': 'Yellow',
        'red': 'Red',
        'feature_coming_soon': 'Feature Coming Soon',
        'feature_coming_soon_desc': 'The {tab} settings are under development and will be available soon.',
        'notifications_coming_soon': 'The notifications settings are under development and will be available soon.',
        'security_coming_soon': 'The security settings are under development and will be available soon.',
        'payment_coming_soon': 'The payment settings are under development and will be available soon.',
        'loading_settings': 'Loading settings...',
        'reset': 'Reset'
      }
    };
    
    // Handle special cases with replacements
    if (key.startsWith('feature_coming_soon_desc') && key.includes('{tab}')) {
      const tab = key.split('{tab}')[1];
      const template = translations[lang]['feature_coming_soon_desc'] || '';
      return template.replace('{tab}', tab);
    }
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  const [activeTab, setActiveTab] = useState<string>("tampilan");
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state with default values
  const [currentSettings, setCurrentSettings] = useState<SettingsState>({
    storeName: "POS Vougher",
    address: "Jl. Sudirman No. 123, Jakarta",
    phone: "+62 812 3456 7890",
    email: "info@posvougher.id",
    currency: "IDR",
    language: "id",
    taxRate: "11",
    receiptHeader: "Terima kasih telah berbelanja di POS Vougher",
    receiptFooter: "Barang yang sudah dibeli tidak dapat dikembalikan",
    theme: 'light',
    fontSize: 'medium',
  });

  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if user is super admin
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || 
                       currentUser?.stores?.some((store: any) => store.role === 'SUPER_ADMIN');

  // Load user data from localStorage
  useEffect(() => {
    const getUserFromLocalStorage = () => {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          setCurrentUser(user);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    };

    getUserFromLocalStorage();
  }, []);

  // Set default active tab based on user role
  useEffect(() => {
    if (currentUser) {
      const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || 
                          currentUser.stores?.some((store: any) => store.role === 'SUPER_ADMIN');
      if (isSuperAdmin) {
        setActiveTab("tampilan"); // Default tab for super admin
      }
    }
  }, [currentUser]);

  // Load settings from database on component mount
  useEffect(() => {
    async function loadSettings() {
      try {
        // Get current store ID from localStorage
        const storeId = localStorage.getItem('currentStoreId');
        if (!storeId) {
          console.error('No store selected');
          router.push('/stores');
          return;
        }
        
        const response = await fetch(`/api/settings?storeId=${storeId}`);
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        
        const data = await response.json();
        if (data.settings && data.settings.length > 0) {
          // Convert array of settings to object
          const settingsObj: Partial<SettingsState> = {};
          data.settings.forEach((setting: { key: string, value: string }) => {
            // Type assertion based on the key to handle specific enum types
            if (setting.key === 'theme') {
              settingsObj.theme = setting.value as 'light' | 'dark' | 'blue' | 'green' | 'yellow' | 'red';
            } else if (setting.key === 'fontSize') {
              settingsObj.fontSize = setting.value as 'small' | 'medium' | 'large';
            } else if (setting.key === 'language') {
              settingsObj.language = setting.value as 'id' | 'en';
            } else {
              // For other string properties, assign directly
              (settingsObj as any)[setting.key] = setting.value;
            }
          });

          // Merge with default settings to ensure all fields exist
          setCurrentSettings(prev => ({
            ...prev,
            ...settingsObj
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('Gagal memuat pengaturan. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Check if settings have changed
  useEffect(() => {
    const hasChanged = 
      currentSettings.theme !== settings.theme ||
      currentSettings.fontSize !== settings.fontSize ||
      currentSettings.language !== settings.language;
    
    setIsChanged(hasChanged);
  }, [currentSettings, settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentSettings({
      ...currentSettings,
      [name]: value,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      // Get the currently active tab to determine which settings to save
      let settingsToSave: Record<string, string> = {};
      
      if (activeTab === "umum") {
        settingsToSave = {
          storeName: currentSettings.storeName,
          address: currentSettings.address,
          phone: currentSettings.phone,
          email: currentSettings.email,
          taxRate: currentSettings.taxRate,
        };
      } else if (activeTab === "tampilan") {
        settingsToSave = {
          language: currentSettings.language,
          currency: currentSettings.currency,
          theme: currentSettings.theme,
        };
      } else if (activeTab === "struk") {
        settingsToSave = {
          receiptHeader: currentSettings.receiptHeader,
          receiptFooter: currentSettings.receiptFooter,
        };
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          settings: settingsToSave,
          storeId: storeId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // If we're in the display tab, apply theme changes immediately
      if (activeTab === "tampilan" && settingsToSave.theme) {
        settings.setTheme(settingsToSave.theme as 'light' | 'dark' | 'blue' | 'green' | 'yellow' | 'red');
        settings.saveSettings();
      }

      setSaveSuccess(true);
      
      // Hide success message after 3 seconds - fix for the setTimeout issue
      window.setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Gagal menyimpan pengaturan. Silakan coba lagi nanti.');
    } finally {
      setSaving(false);
    }
  };

  // Handle settings changes
  const handleThemeChange = (theme: Theme) => {
    setCurrentSettings(prev => ({ ...prev, theme }));
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    setCurrentSettings(prev => ({ ...prev, fontSize }));
  };

  // Handle language change specifically
  const handleLanguageChange = (language: Language) => {
    setCurrentSettings(prev => ({ ...prev, language }));
  };

  // Additional effect to detect when language is changed and apply it immediately
  useEffect(() => {
    if (currentSettings.language !== settings.language) {
      console.log(`Language changed from ${settings.language} to ${currentSettings.language}`);
    }
  }, [currentSettings.language, settings.language]);

  // Save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      // Save to database via API
      const settingsToSave = {
        theme: currentSettings.theme,
        fontSize: currentSettings.fontSize,
        language: currentSettings.language,
        // Include other settings as needed
        storeName: currentSettings.storeName,
        address: currentSettings.address,
        phone: currentSettings.phone,
        email: currentSettings.email,
        currency: currentSettings.currency,
        taxRate: currentSettings.taxRate,
        receiptHeader: currentSettings.receiptHeader,
        receiptFooter: currentSettings.receiptFooter,
      };
      
      const requestData = { 
        settings: settingsToSave, 
        storeId: storeId 
      };
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings to database');
      }
      
      // Update context settings
      settings.setTheme(currentSettings.theme);
      settings.setFontSize(currentSettings.fontSize);
      
      // Type cast language to the expected type
      if (currentSettings.language === 'id' || currentSettings.language === 'en') {
        // Set cookie before context update to ensure it's ready when the page reloads
        document.cookie = `NEXT_LOCALE=${currentSettings.language}; path=/; max-age=31536000`;
        
        // Update context
        settings.setLanguage(currentSettings.language);
      }
      
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
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: t('settings_error') });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel changes
  const handleCancel = () => {
    setCurrentSettings({
      storeName: "POS Vougher",
      address: "Jl. Sudirman No. 123, Jakarta",
      phone: "+62 812 3456 7890",
      email: "info@posvougher.id",
      currency: "IDR",
      language: "id",
      taxRate: "11",
      receiptHeader: "Terima kasih telah berbelanja di POS Vougher",
      receiptFooter: "Barang yang sudah dibeli tidak dapat dikembalikan",
      theme: 'light',
      fontSize: 'medium',
    });
  };

  return (
    <div className="pengaturan-page-wrapper relative">
      {/* Decorative background elements */}
      <div className="pos-background absolute inset-0 overflow-hidden">
        <div className="deco-circle-1 absolute w-200 h-200 rounded-full border-4 border-black bg-brutalism-yellow/20 -top-50 right-[10%] animate-float"></div>
        <div className="deco-circle-2 absolute w-100 h-100 rounded-full border-4 border-black bg-brutalism-green/20 bottom-[5%] left-[15%] animate-float-reverse"></div>
        <div className="deco-square-1 absolute w-120 h-120 border-4 border-black bg-brutalism-blue/20 bottom-[10%] right-[5%] rotate-15 animate-rotate"></div>
        <div className="deco-square-2 absolute w-80 h-80 border-4 border-black bg-brutalism-red/20 top-[20%] left-[5%] -rotate-10 animate-rotate-reverse"></div>
        <div className="deco-line-1 absolute h-1 w-150 bg-black top-[30%] left-0 rotate-45"></div>
        <div className="deco-line-2 absolute h-1 w-100 bg-black bottom-[20%] right-[20%] -rotate-30"></div>
        <div className="deco-dot-1 absolute w-5 h-5 rounded-full bg-black top-[25%] right-[30%]"></div>
        <div className="deco-dot-2 absolute w-5 h-5 rounded-full bg-black top-[40%] left-[20%]"></div>
        <div className="deco-dot-3 absolute w-5 h-5 rounded-full bg-black bottom-[30%] right-[15%]"></div>
        <div className="deco-dot-4 absolute w-5 h-5 rounded-full bg-black bottom-[10%] left-[40%]"></div>
        <div className="grid-pattern absolute inset-0 bg-grid-pattern opacity-50"></div>
      </div>

      <div className="dashboard-container relative z-10">
        <div className="dashboard-header">
          <h1>{t('settings')}</h1>
        </div>

        {loading ? (
          <Card className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="font-medium">{t('loading_settings')}</p>
            </div>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white p-6 border-3 border-brutalism-black shadow-brutal rounded-md">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Settings Navigation */}
                <div className="w-full md:w-1/4">
                  <Card className="sticky top-6">
                    <div className="brutalism-header">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                          <Settings className="w-5 h-5" /> {t('categories')}
                      </h2>
                    </div>
                    <ul className="space-y-1">
                      {isSuperAdmin ? (
                        // Only show Display & Language and Database for super admin
                        <>
                          <li>
                            <button 
                              onClick={() => setActiveTab("tampilan")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "tampilan" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <Globe className="w-4 h-4" /> {t('display_language')}
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => setActiveTab("database")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "database" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <Database className="w-4 h-4" /> {t('database')}
                            </button>
                          </li>
                        </>
                      ) : (
                        // Regular user - show all options
                        <>
                          <li>
                            <button 
                              onClick={() => setActiveTab("umum")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "umum" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <Store className="w-4 h-4" /> {t('general')}
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => setActiveTab("tampilan")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "tampilan" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <Globe className="w-4 h-4" /> {t('display_language')}
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => setActiveTab("notifikasi")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "notifikasi" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <Bell className="w-4 h-4" /> {t('notifications')}
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => setActiveTab("keamanan")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "keamanan" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <Lock className="w-4 h-4" /> {t('security')}
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => setActiveTab("pembayaran")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "pembayaran" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <CreditCard className="w-4 h-4" /> {t('payment')}
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => setActiveTab("struk")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "struk" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <Printer className="w-4 h-4" /> {t('receipt')}
                            </button>
                          </li>
                          <li>
                            <button 
                              onClick={() => setActiveTab("database")}
                              className={`w-full text-left p-2 font-medium flex items-center gap-2 rounded ${activeTab === "database" ? "bg-brutalism-yellow" : "hover:bg-gray-100"}`}
                            >
                                <Database className="w-4 h-4" /> {t('database')}
                            </button>
                          </li>
                        </>
                      )}
                    </ul>
                  </Card>
                </div>

                {/* Settings Content */}
                <div className="w-full md:w-3/4">
                  <Card>
                      {/* Success message */}
                      {saveSuccess && (
                        <div className="mb-4 p-3 bg-green-50 border-3 border-brutalism-green text-green-800 font-medium">
                          {t('settings_saved')}
                        </div>
                      )}
                      
                      {/* Error message */}
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 border-3 border-brutalism-red text-red-800 font-medium">
                          {error}
                        </div>
                      )}

                    {activeTab === "umum" && (
                      <div>
                        <div className="brutalism-header">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                              <Store className="w-5 h-5" /> {t('general_settings')}
                          </h2>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                          <div className="space-y-4">
                            <Input 
                                label={t('store_name')}
                              name="storeName" 
                                value={currentSettings.storeName} 
                              onChange={handleChange} 
                                required
                            />
                            <Input 
                                label={t('address')}
                              name="address" 
                                value={currentSettings.address} 
                              onChange={handleChange} 
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input 
                                  label={t('phone')}
                                name="phone" 
                                  value={currentSettings.phone} 
                                onChange={handleChange} 
                              />
                              <Input 
                                  label={t('email')}
                                name="email" 
                                  value={currentSettings.email} 
                                onChange={handleChange} 
                              />
                            </div>
                            <Input 
                                label={t('tax_rate')}
                              type="number"
                              name="taxRate" 
                                value={currentSettings.taxRate} 
                              onChange={handleChange} 
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? t('saving') : t('save_settings')}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {activeTab === "database" && (
                      <div>
                        <div className="brutalism-header">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                              <Database className="w-5 h-5" /> {t('database_settings')}
                          </h2>
                        </div>
                        <div className="space-y-6">
                          <div className="border-3 border-brutalism-black p-4 bg-red-50">
                              <h3 className="text-lg font-bold text-brutalism-red mb-2">{t('warning')}</h3>
                              <p>{t('db_reset_warning')}</p>
                          </div>
                          
                          <div className="border-3 border-brutalism-black p-4 bg-yellow-50">
                              <h3 className="text-lg font-bold mb-2">{t('db_reset')}</h3>
                              <p className="mb-4">{t('db_reset_desc')}</p>
                            <Button 
                              variant="danger"
                              onClick={() => {
                                  const confirmMessage = settings.language === 'id' 
                                    ? "Anda yakin ingin mereset database? Semua data akan dihapus."
                                    : "Are you sure you want to reset the database? All data will be deleted.";
                                  const successMessage = settings.language === 'id'
                                    ? "Database berhasil direset!"
                                    : "Database reset successfully!";
                                  const errorPrefix = settings.language === 'id'
                                    ? "Gagal mereset database: "
                                    : "Failed to reset database: ";
                                  const errorMessage = settings.language === 'id'
                                    ? "Error: "
                                    : "Error: ";
                                  
                                  if (confirm(confirmMessage)) {
                                  fetch("/api/db-reset")
                                    .then(res => res.json())
                                    .then(data => {
                                      if (data.success) {
                                          alert(successMessage);
                                      } else {
                                          alert(errorPrefix + data.error);
                                      }
                                    })
                                    .catch(err => {
                                        alert(errorMessage + err.message);
                                    });
                                }
                              }}
                            >
                                {t('db_reset')}
                            </Button>
                          </div>
                          
                          <div className="border-3 border-brutalism-black p-4 bg-green-50">
                              <h3 className="text-lg font-bold mb-2">{t('db_backup')}</h3>
                              <p className="mb-4">{t('db_backup_desc')}</p>
                            <Button variant="success">
                                {t('download_backup')}
                            </Button>
                            </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "struk" && (
                      <div>
                        <div className="brutalism-header">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                              <Printer className="w-5 h-5" /> {t('receipt_settings')}
                          </h2>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block mb-1 font-medium text-brutalism-black">
                                  {t('header_receipt')}
                              </label>
                              <textarea 
                                name="receiptHeader"
                                  value={currentSettings.receiptHeader}
                                  onChange={handleChange}
                                className="w-full py-2 px-3 bg-white border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:ring-0 focus:shadow-none transform focus:translate-y-1 transition-transform h-24"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 font-medium text-brutalism-black">
                                  {t('footer_receipt')}
                              </label>
                              <textarea 
                                name="receiptFooter"
                                  value={currentSettings.receiptFooter}
                                  onChange={handleChange}
                                className="w-full py-2 px-3 bg-white border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:ring-0 focus:shadow-none transform focus:translate-y-1 transition-transform h-24"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? t('saving') : t('save_settings')}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {activeTab === "tampilan" && (
                      <div>
                        <div className="brutalism-header">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                              <Globe className="w-5 h-5" /> {t('display_language')}
                          </h2>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block mb-1 font-medium text-brutalism-black">
                                  {t('language.title')}
                              </label>
                              <select 
                                name="language"
                                  value={currentSettings.language}
                                  onChange={handleChange}
                                className="w-full py-2 px-3 bg-white border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:ring-0 focus:shadow-none transform focus:translate-y-1 transition-transform"
                              >
                                  <option value="id">{t('language.indonesian')}</option>
                                  <option value="en">{t('language.english')}</option>
                              </select>
                            </div>
                            <div>
                              <label className="block mb-1 font-medium text-brutalism-black">
                                  {t('currency')}
                              </label>
                              <select 
                                name="currency"
                                  value={currentSettings.currency}
                                  onChange={handleChange}
                                className="w-full py-2 px-3 bg-white border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:ring-0 focus:shadow-none transform focus:translate-y-1 transition-transform"
                              >
                                <option value="IDR">Rupiah (IDR)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="EUR">Euro (EUR)</option>
                                <option value="SGD">Singapore Dollar (SGD)</option>
                              </select>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold my-2">{t('theme_options')}</h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="flex flex-col items-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleThemeChange('light')}
                                    className={`w-full aspect-square border-3 border-brutalism-black bg-white mb-2 
                                      ${currentSettings.theme === 'light' ? 'ring-4 ring-offset-2 shadow-brutal-sm' : ''}
                                      transition-all hover:shadow-brutal-xs hover:scale-105`}
                                  ></button>
                                  <span>{t('display.light')}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleThemeChange('dark')}
                                    className={`w-full aspect-square border-3 border-brutalism-black bg-gray-800 mb-2 
                                      ${currentSettings.theme === 'dark' ? 'ring-4 ring-offset-2 shadow-brutal-sm' : ''}
                                      transition-all hover:shadow-brutal-xs hover:scale-105`}
                                  ></button>
                                  <span>{t('display.dark')}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleThemeChange('blue')}
                                    className={`w-full aspect-square border-3 border-brutalism-black bg-brutalism-blue mb-2 
                                      ${currentSettings.theme === 'blue' ? 'ring-4 ring-offset-2 shadow-brutal-sm' : ''}
                                      transition-all hover:shadow-brutal-xs hover:scale-105`}
                                  ></button>
                                  <span>{t('blue')}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleThemeChange('green')}
                                    className={`w-full aspect-square border-3 border-brutalism-black bg-brutalism-green mb-2 
                                      ${currentSettings.theme === 'green' ? 'ring-4 ring-offset-2 shadow-brutal-sm' : ''}
                                      transition-all hover:shadow-brutal-xs hover:scale-105`}
                                  ></button>
                                  <span>{t('green')}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleThemeChange('yellow')}
                                    className={`w-full aspect-square border-3 border-brutalism-black bg-brutalism-yellow mb-2 
                                      ${currentSettings.theme === 'yellow' ? 'ring-4 ring-offset-2 shadow-brutal-sm' : ''}
                                      transition-all hover:shadow-brutal-xs hover:scale-105`}
                                  ></button>
                                  <span>{t('yellow')}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleThemeChange('red')}
                                    className={`w-full aspect-square border-3 border-brutalism-black bg-brutalism-red mb-2 
                                      ${currentSettings.theme === 'red' ? 'ring-4 ring-offset-2 shadow-brutal-sm' : ''}
                                      transition-all hover:shadow-brutal-xs hover:scale-105`}
                                  ></button>
                                  <span>{t('red')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <button 
                                type="button"
                                onClick={() => handleThemeChange('light')}
                                className="py-2 px-4 border-2 border-brutalism-black bg-white shadow-brutal-xs hover:shadow-brutal-sm transition-all"
                              >
                                {t('reset')} {t('display.theme')}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? t('saving') : t('save_settings')}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {(activeTab === "notifikasi" || activeTab === "keamanan" || activeTab === "pembayaran") && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 border-3 border-brutalism-black bg-brutalism-yellow mb-4 rotate-15 flex items-center justify-center shadow-brutal">
                          <Settings className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold">{t('feature_coming_soon')}</h3>
                        <p className="mt-2 text-center max-w-md">
                            {activeTab === "notifikasi" ? t('notifications_coming_soon') : 
                             activeTab === "keamanan" ? t('security_coming_soon') : 
                             t('payment_coming_soon')}
                        </p>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <StoreSelector />
          </div>
        </div>
        )}

        {saveMessage && (
          <div className={`${
            saveMessage.type === 'success' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
          } border-3 p-3 my-4 flex items-center`}>
            {saveMessage.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleSaveSettings}
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
    </div>
  );
}