
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { getNotifications, saveNotifications } from '../services/storageService';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  requestPermission: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    // Initialize from storage only
    return getNotifications();
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }
    if (Notification.permission !== 'denied' && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  // Persist notifications to storage whenever they change
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'info') => {
    const newNotification: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      time: new Date().toISOString(),
      isRead: false,
      type
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show system notification if permitted
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification(title, {
        body: message,
        icon: '/manifest/icon-192x192.png' // Adjust path if needed or remove
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead,
      requestPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
