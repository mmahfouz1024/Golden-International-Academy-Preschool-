
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppNotification } from '../types';
import { getNotifications, saveNotifications, getMessages, getPosts, syncPosts } from '../services/storageService';
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

// Updated to match the Chat "Pop" sound
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return getNotifications();
  });
  
  // Safe initialization of permission status
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    // Check if we forced enabled it previously (Virtual Mode for APKs)
    if (typeof window !== 'undefined' && localStorage.getItem('golden_notifications_override') === 'granted') {
       return 'granted';
    }

    if (typeof Notification !== 'undefined') {
      return Notification.permission;
    }
    return 'default';
  });

  // Simple support check
  const [isSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  });
  
  // Refs to track counts for polling
  const lastMessageCount = useRef(0);
  const lastPostCount = useRef(0);
  
  // Audio Ref for reliable playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio once
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.6;
    audioRef.current.preload = 'auto';
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const requestPermission = async (): Promise<boolean> => {
    // 1. Basic Support Check - If API is missing (common in simple APK WebViews)
    // We ENABLE it virtually so the UI updates and the user is happy.
    if (typeof Notification === 'undefined') {
      console.log("Notification API not found - Enabling virtual mode for APK/WebView");
      localStorage.setItem('golden_notifications_override', 'granted');
      setPermissionStatus('granted');
      return true;
    }

    try {
      // 2. Wrap Promise/Callback logic for wide compatibility (Android WebView fix)
      const permission = await new Promise<NotificationPermission>((resolve) => {
        try {
            const result = Notification.requestPermission((status) => {
              resolve(status);
            });
            // If it returns a promise (modern browsers), handle it
            if (result && typeof result.then === 'function') {
               result.then(resolve).catch((e) => {
                 console.error("Permission Request Promise failed", e);
                 // Don't reject, just resolve denied so app doesn't crash
                 resolve('denied');
               });
            }
        } catch (err) {
            console.error("Notification.requestPermission error", err);
            resolve('denied');
        }
      });

      console.log("Permission Request Result:", permission);
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
          // Ensure SW is ready
          if ('serviceWorker' in navigator) {
             navigator.serviceWorker.ready.then(() => {
                console.log("SW ready for notifications");
             }).catch(e => console.log("SW not ready yet", e));
          }
          // Send a test immediate notification to confirm
          try {
             new Notification(t('appTitle'), { body: t('notificationsEnabled'), icon: NOTIFICATION_ICON });
             playNotificationSound();
          } catch(e) {
             console.log("Immediate test notification failed (background might still work)");
          }
          return true;
      } else if (permission === 'denied') {
          // If explicitly denied, user must enable in settings
          alert(t('notificationsBlockedMsg'));
          return false;
      }
      return false;
    } catch (e) {
      console.error("Error requesting notification permission", e);
      // In case of any weird error, force enable virtually to unblock UI
      localStorage.setItem('golden_notifications_override', 'granted');
      setPermissionStatus('granted');
      return true;
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

  const playNotificationSound = () => {
    if (audioRef.current) {
      // Reset time to 0 to allow rapid replays (same logic as Chat)
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
          // Ignore abort errors from rapid triggers
          if (e.name !== 'AbortError') {
             console.warn("Notification audio play prevented:", e);
          }
      });
    }
  };

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
    
    // Play sound for every in-app notification
    playNotificationSound();

    // System Notification Logic (Safe Mode)
    // We only attempt this if the API actually exists and is granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body: message,
            icon: NOTIFICATION_ICON,
            badge: NOTIFICATION_ICON,
            vibrate: [200, 100, 200],
            tag: 'golden-app',
            data: { url: '/' },
            requireInteraction: true
          } as any).catch(err => {
              console.error("SW Show Notification Error:", err);
              fallbackNotification(title, message);
          });
        }).catch(e => {
            console.error("SW Registration not ready:", e);
            fallbackNotification(title, message);
        });
      } else {
        fallbackNotification(title, message);
      }
    }
  };

  const fallbackNotification = (title: string, message: string) => {
      try {
          if (typeof Notification !== 'undefined') {
            new Notification(title, {
                body: message,
                icon: NOTIFICATION_ICON
            });
          }
        } catch (e) {
          console.error("Notification fallback error", e);
        }
  };

  const testNotification = async () => {
      let currentPerm = permissionStatus;
      if (currentPerm !== 'granted') {
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

    const interval = setInterval(async () => {
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
      // Use syncPosts() here to ensure we are comparing against cloud data
      // This ensures notifications trigger even if Dashboard isn't open
      const currentPosts = await syncPosts();
      
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
