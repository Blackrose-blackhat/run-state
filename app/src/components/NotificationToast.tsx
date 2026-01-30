import React from 'react';
import { useNotifications } from '../lib/notifications';

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '360px',
      fontFamily: 'monospace'
    }}>
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className="view-fade-in"
          style={{
            padding: '12px 16px',
            border: `2px solid ${n.type === 'error' ? '#FF0000' : n.type === 'warning' ? '#FFB000' : n.type === 'success' ? '#00FF41' : '#00BFFF'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#050505',
            color: n.type === 'error' ? '#FF0000' : n.type === 'warning' ? '#FFB000' : n.type === 'success' ? '#00FF41' : '#00BFFF',
            boxShadow: `0 0 15px ${n.type === 'error' ? 'rgba(255,0,0,0.2)' : n.type === 'warning' ? 'rgba(255,176,0,0.2)' : n.type === 'success' ? 'rgba(0,255,65,0.2)' : 'rgba(0,191,255,0.2)'}`
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            [{n.type === 'error' ? 'ERR' : n.type === 'warning' ? 'WARN' : n.type === 'success' ? 'OK' : 'INFO'}] {n.message}
          </div>
          <button 
            onClick={() => removeNotification(n.id)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit',
              cursor: 'pointer',
              padding: '4px',
              marginLeft: '12px',
              fontSize: '1rem'
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
