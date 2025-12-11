
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppNotification } from '../types';
import { getNotifications, saveNotifications, getMessages, getPosts } from '../services/storageService';
import { useLanguage } from './LanguageContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  requestPermission: () => Promise<boolean>;
  permissionStatus: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return getNotifications();
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(Notification.permission);
  
  // Refs to track counts for polling
  const lastMessageCount = useRef(0);
  const lastPostCount = useRef(0);
  const currentUser = useRef(localStorage.getItem('golden_session_uid'));

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
    return result === 'granted';
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
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

    // Show system notification via Service Worker (Best for Mobile)
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body: message,
            icon: '/manifest/icon-192x192.png',
            vibrate: [200, 100, 200],
            tag: 'golden-app'
          } as any);
        });
      } else {
        // Fallback
        new Notification(title, {
          body: message,
          icon: '/manifest/icon-192x192.png'
        });
      }
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // POLLING EFFECT: Check for new Messages and Posts every 5 seconds
  useEffect(() => {
    // Initial Load
    const msgs = getMessages();
    const posts = getPosts();
    lastMessageCount.current = msgs.length;
    lastPostCount.current = posts.length;

    const interval = setInterval(() => {
      // Re-read current user
      const uid = localStorage.getItem('golden_session_uid');
      if (!uid) return;

      // Check Messages
      const currentMsgs = getMessages();
      if (currentMsgs.length > lastMessageCount.current) {
        // Find new messages for me
        const newMsgs = currentMsgs.slice(lastMessageCount.current);
        const myNewMsgs = newMsgs.filter(m => m.receiverId === uid);
        
        myNewMsgs.forEach(msg => {
           // We have a new message!
           addNotification(t('newMessage'), msg.content, 'info');
        });
        lastMessageCount.current = currentMsgs.length;
      } else {
        lastMessageCount.current = currentMsgs.length; // Sync in case of deletion
      }

      // Check Announcements (Posts)
      const currentPosts = getPosts();
      if (currentPosts.length > lastPostCount.current) {
         const newPosts = currentPosts.slice(lastPostCount.current);
         // Filter posts not by me
         const othersPosts = newPosts.filter(p => p.authorId !== uid);
         
         othersPosts.forEach(post => {
            addNotification(t('newAnnouncement'), post.content, 'warning');
         });
         lastPostCount.current = currentPosts.length;
      } else {
         lastPostCount.current = currentPosts.length;
      }

    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead,
      requestPermission,
      permissionStatus
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
