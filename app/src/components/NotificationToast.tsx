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
      maxWidth: '320px'
    }}>
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className="view-fade-in card"
          style={{
            padding: '12px 16px',
            borderLeft: `4px solid var(--${n.type})`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            background: 'var(--card)',
            color: 'var(--card-foreground)'
          }}
        >
          <div style={{ fontSize: '0.875rem' }}>{n.message}</div>
          <button 
            onClick={() => removeNotification(n.id)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
