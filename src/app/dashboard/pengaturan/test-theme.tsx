'use client';

import { useSettings } from '@/contexts/SettingsContext';

export default function TestTheme() {
  const settings = useSettings();
  
  const handleThemeChange = () => {
    // Cycle through all available themes
    const themes = ['light', 'dark', 'blue', 'green', 'yellow', 'red'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    
    settings.setTheme(newTheme as any);
    settings.saveSettings();
  };
  
  return (
    <div className="p-4 border-3 border-brutalism-black rounded-md">
      <h2 className="text-2xl font-bold mb-4">Theme Test</h2>
      <p className="mb-4">Current theme: <span className="font-bold">{settings.theme}</span></p>
      <button 
        onClick={handleThemeChange}
        className="bg-brutalism-yellow p-2 border-2 border-brutalism-black shadow-brutal-sm font-medium"
      >
        Cycle Theme
      </button>
    </div>
  );
} 