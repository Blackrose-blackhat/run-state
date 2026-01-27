// src/lib/notifications.ts
import { createContext, useContext, useState, ReactNode } from 'react';

type Notification = {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
};

type NotificationsContextType = {
  notifications: Notification[];
  addNotification: (msg: string, type?: Notification['type']) => void;
  removeNotification: (id: number) => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (msg: string, type: Notification['type'] = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message: msg, type }]);
    // Auto-remove after 5 seconds
    setTimeout(() => removeNotification(id), 5000);
  };
  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
};
