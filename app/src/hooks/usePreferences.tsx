// src/hooks/usePreferences.ts
import { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

type Preferences = {
  theme: Theme;
  language: string; // e.g., 'en', 'es'
  showAnimations: boolean;
};

type PreferencesContextType = {
  preferences: Preferences;
  setPreferences: (prefs: Preferences) => void;
  toggleTheme: () => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem('preferences');
    if (stored) {
      return JSON.parse(stored) as Preferences;
    }
    // default preferences
    return {
      theme: 'dark', // default to dark as per user request
      language: 'en',
      showAnimations: true,
    };
  });

  const toggleTheme = () => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...preferences, theme: newTheme };
    setPreferences(updated);
    localStorage.setItem('preferences', JSON.stringify(updated));
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // sync theme on load
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, toggleTheme }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
};
