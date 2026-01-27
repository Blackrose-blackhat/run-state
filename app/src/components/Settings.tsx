import React from 'react';
import { usePreferences } from '../hooks/usePreferences';

export const Settings: React.FC = () => {
  const { preferences, setPreferences, toggleTheme } = usePreferences();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPreferences({ ...preferences, language: e.target.value });
  };

  const handleAnimationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({ ...preferences, showAnimations: e.target.checked });
  };

  return (
    <div className="view-fade-in" style={{ maxWidth: '600px' }}>
      <h1>Settings</h1>
      
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Appearance</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Theme</div>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Switch between light and dark mode</div>
          </div>
          <button className="btn btn-secondary" onClick={toggleTheme}>
            {preferences.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Animations</div>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Enable or disable UI transitions</div>
          </div>
          <input 
            type="checkbox" 
            checked={preferences.showAnimations} 
            onChange={handleAnimationToggle}
            style={{ width: '1.25rem', height: '1.25rem' }}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Localization</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Language</div>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>Choose your preferred language</div>
          </div>
          <select 
            className="search-input" 
            value={preferences.language} 
            onChange={handleLanguageChange}
            style={{ width: '120px' }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }} className="text-muted">
        DevResidue v1.0.0
      </div>
    </div>
  );
};
