// src/hooks/usePreferences.ts
import { createContext, useContext, useState, ReactNode } from 'react';

type Preferences = {
  language: string; // e.g., 'en', 'es'
  showAnimations: boolean;
};

type PreferencesContextType = {
  preferences: Preferences;
  setPreferences: (prefs: Preferences) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem('preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          language: parsed.language || 'en',
          showAnimations: parsed.showAnimations !== undefined ? parsed.showAnimations : true,
        };
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }
    // default preferences
    return {
      language: 'en',
      showAnimations: true,
    };
  });

  const updatePreferences = (newPrefs: Preferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('preferences', JSON.stringify(newPrefs));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences: updatePreferences }}>
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
