
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
  testNotification: () => void;
  isSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Use a reliable external URL for the icon to ensure mobile devices render it
const NOTIFICATION_ICON = "https://cdn-icons-png.flaticon.com/512/2990/2990638.png";

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return getNotifications();
  });
  
  // Safe initialization of permission status
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof Notification !== 'undefined') {
      return Notification.permission;
    }
    return 'default';
  });

  const [isSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  });
  
  // Refs to track counts for polling
  const lastMessageCount = useRef(0);
  const lastPostCount = useRef(0);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const requestPermission = async () => {
    if (!isSupported) {
       alert(t('notificationsNotSupported'));
       return false;
    }
    
    // Secure Context Check for Android/Mobile
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
       alert(t('httpsRequired'));
       return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
      if (result === 'granted') {
          // Ensure SW is ready
          if ('serviceWorker' in navigator) {
             navigator.serviceWorker.ready.then(() => {
                console.log("SW ready for notifications");
             });
          }
      }
      return result === 'granted';
    } catch (e) {
      console.error("Error requesting notification permission", e);
      return false;
    }
  };

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
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
    if (isSupported && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          // Cast options to any to avoid TS error with 'vibrate'
          registration.showNotification(title, {
            body: message,
            icon: NOTIFICATION_ICON, // Using valid URL is critical for Android
            badge: NOTIFICATION_ICON,
            vibrate: [200, 100, 200],
            tag: 'golden-app',
            data: { url: '/' },
            requireInteraction: true // Keeps notification visible until clicked
          } as any).catch(err => console.error("SW Show Notification Error:", err));
        }).catch(e => {
            console.error("SW Registration not ready:", e);
            // Fallback to standard notification if SW fails
            try {
                new Notification(title, {
                    body: message,
                    icon: NOTIFICATION_ICON
                });
            } catch (fallbackErr) {
                console.error("Fallback notification failed", fallbackErr);
            }
        });
      } else {
        // Fallback for browsers without SW support
        try {
          new Notification(title, {
            body: message,
            icon: NOTIFICATION_ICON
          });
        } catch (e) {
          console.error("Notification fallback error", e);
        }
      }
    }
  };

  const testNotification = async () => {
      if (permissionStatus !== 'granted') {
          const granted = await requestPermission();
          if (!granted) return;
      }
      
      try {
          addNotification("Golden Academy", "This is a test notification! 🔔", "success");
      } catch (e) {
          alert("Error sending notification: " + e);
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
      permissionStatus,
      testNotification,
      isSupported
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
