import React from "react";
import { View } from "../types";

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  status: "starting" | "ready" | "unreachable" | "error";
  theme: "light" | "dark";
  toggleTheme: () => void;
  forgottenCount?: number;
  orphanedCount?: number;
}

/**
 * Sidebar component for navigation and global actions (theme toggle).
 */
export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  status,
  theme,
  toggleTheme,
  forgottenCount = 0,
  orphanedCount = 0
}) => {
  return (
    <div className="sidebar glass">
      <div style={{ marginBottom: '2.5rem', padding: '0 8px' }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 800, 
          margin: 0, 
          letterSpacing: '-0.03em',
          color: 'var(--primary)'
        }}>
          RunState
        </h2>
        <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.8 }}>
          Liveness Intelligence
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div 
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setActiveView('dashboard')}
        >
          <span style={{ marginRight: '12px' }}>📊</span> Dashboard
        </div>
        <div 
          className={`nav-item ${activeView === 'ports' ? 'active' : ''}`} 
          onClick={() => setActiveView('ports')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span><span style={{ marginRight: '12px' }}>🔌</span> Port Monitor</span>
          {forgottenCount > 0 && (
            <span style={{
              background: 'var(--warning)',
              color: '#000',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '6px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {forgottenCount}
            </span>
          )}
        </div>
        <div 
          className={`nav-item ${activeView === 'processes' ? 'active' : ''}`} 
          onClick={() => setActiveView('processes')}
        >
          <span style={{ marginRight: '12px' }}>📑</span> Process List
        </div>
        <div 
          className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} 
          onClick={() => setActiveView('settings')}
        >
          <span style={{ marginRight: '12px' }}>⚙️</span> Settings
        </div>
      </nav>

      {(forgottenCount > 0 || orphanedCount > 0) && (
        <div style={{ marginTop: '32px' }}>
          <div className="text-muted" style={{ 
            fontSize: '0.7rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em', 
            marginBottom: '12px', 
            paddingLeft: '16px',
            fontWeight: 700
          }}>
            Critical Alerts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {forgottenCount > 0 && (
              <div 
                className="nav-item urgent-bg" 
                style={{ color: 'var(--warning)', fontSize: '0.8rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                onClick={() => setActiveView('ports')}
              >
                ⚠️ {forgottenCount} Forgotten
              </div>
            )}
            {orphanedCount > 0 && (
              <div 
                className="nav-item danger-bg" 
                style={{ color: 'var(--destructive)', fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                onClick={() => setActiveView('ports')}
              >
                🚨 {orphanedCount} Orphaned
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button 
          className="btn btn-ghost" 
          style={{ justifyContent: 'start', padding: '10px 16px', width: '100%', borderRadius: 'var(--radius)' }} 
          onClick={toggleTheme}
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'var(--secondary)',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          transition: 'var(--transition)'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div 
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: status === 'ready' ? 'var(--success)' : 'var(--destructive)',
                boxShadow: status === 'ready' ? '0 0 8px var(--success)' : '0 0 8px var(--destructive)'
              }} 
             />
             <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>
               {status === 'ready' ? 'System Live' : 'Offline'}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};

