

import { MOCK_USERS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_REPORTS } from '../constants';
import { User, Student, ClassGroup, DailyReport, DatabaseConfig, AppNotification, ChatMessage } from '../types';
import { initSupabase, syncDataToCloud, fetchDataFromCloud } from './supabaseClient';

const KEYS = {
  USERS: 'golden_academy_users',
  STUDENTS: 'golden_academy_students',
  CLASSES: 'golden_academy_classes',
  REPORTS: 'golden_academy_reports',
  DB_CONFIG: 'golden_academy_db_config',
  NOTIFICATIONS: 'golden_academy_notifications',
  MESSAGES: 'golden_academy_messages'
};

// Initialize DB
let isCloudEnabled = false;

// Default Credentials from user request
const DEFAULT_CONFIG: DatabaseConfig = {
  isEnabled: true, // Force enabled by default
  url: 'https://jompzhrrgazbsqoetdbh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXB6aHJyZ2F6YnNxb2V0ZGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzkzNDMsImV4cCI6MjA4MDg1NTM0M30.av1WThwU7L0WeUHPzw29bt-OL-esWH-OihZJCIgXbAc',
  autoSync: true
};

export const initStorage = async (): Promise<{ success: boolean; message?: string }> => {
  const config = getDatabaseConfig();
  
  // Update local config to defaults if missing key parts (healing step for existing users)
  if (config.isEnabled && (!config.url || !config.key)) {
     config.url = DEFAULT_CONFIG.url;
     config.key = DEFAULT_CONFIG.key;
     saveDatabaseConfig(config);
  }

  if (config.isEnabled && config.url && config.key) {
    // STRICT MODE: Clear local cache to ensure we ONLY view data from DB
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.STUDENTS);
    localStorage.removeItem(KEYS.CLASSES);
    localStorage.removeItem(KEYS.REPORTS);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.MESSAGES);

    const connected = initSupabase(config);
    isCloudEnabled = connected;

    if (!connected) {
      console.error("⚠️ Failed to initialize Supabase client.");
      return { success: false, message: 'Client Initialization Failed' };
    }

    console.log("🔗 Connecting to Supabase...");
    try {
      // 1. Check Connection by trying to fetch one key (Users)
      const { data, error } = await fetchDataFromCloud(KEYS.USERS);
      
      if (error) {
        console.error("⚠️ Database connection error:", error);
        const errorMessage = typeof error === 'string' ? error : (error as any).message;
        // Return failure to block the app
        return { success: false, message: errorMessage || 'Connection Refused' };
      }
      
      // 2. Data Logic
      if (!data) {
        // DB is connected but empty. 
        console.log("☁️ Database connected but empty. Seeding initial data...");
        // Temporarily populate local storage with Mocks to upload them
        localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
        localStorage.setItem(KEYS.STUDENTS, JSON.stringify(MOCK_STUDENTS));
        localStorage.setItem(KEYS.CLASSES, JSON.stringify(MOCK_CLASSES));
        localStorage.setItem(KEYS.REPORTS, JSON.stringify(MOCK_REPORTS));
        
        // Seed default notification so it exists in DB
        const defaultNotifications: AppNotification[] = [{
          id: '1',
          title: 'Welcome',
          message: 'Welcome to Golden International Academy System',
          time: new Date().toISOString(),
          isRead: false,
          type: 'info'
        }];
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(defaultNotifications));
        localStorage.setItem(KEYS.MESSAGES, '[]');
        
        const seeded = await forceSyncToCloud();
        if (!seeded) {
             return { success: false, message: 'Failed to seed database' };
        }
      } else {
        // 3. Data exists in Cloud. Sync it DOWN to the now-empty local storage.
        console.log("📥 Downloading fresh data from Cloud...");
        const synced = await syncAllFromCloud();
        if (!synced) {
            return { success: false, message: 'Failed to retrieve data from Database' };
        }
      }

      return { success: true, message: 'Connected' };

    } catch (error: any) {
      console.error("⚠️ Exception during DB init:", error);
      return { success: false, message: error?.message || 'Network Error' };
    }
  }
  
  return { success: true, message: 'Local Mode (DB Disabled)' };
};

// Database Config
export const getDatabaseConfig = (): DatabaseConfig => {
  const stored = localStorage.getItem(KEYS.DB_CONFIG);
  if (!stored) {
    localStorage.setItem(KEYS.DB_CONFIG, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
  return JSON.parse(stored);
};

export const saveDatabaseConfig = (config: DatabaseConfig) => {
  localStorage.setItem(KEYS.DB_CONFIG, JSON.stringify(config));
  // Re-init
  initSupabase(config);
  isCloudEnabled = config.isEnabled;
};

// Generic Sync Helpers
const saveAndSync = async (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
  if (isCloudEnabled) {
    // Fire and forget sync to avoid UI blocking
    syncDataToCloud(key, data).catch(err => console.error(`Failed to sync ${key}:`, err));
  }
};

const syncAllFromCloud = async () => {
  try {
    const keys = [KEYS.USERS, KEYS.STUDENTS, KEYS.CLASSES, KEYS.REPORTS, KEYS.NOTIFICATIONS, KEYS.MESSAGES];
    let syncedCount = 0;
    for (const key of keys) {
      const { data } = await fetchDataFromCloud(key);
      if (data) {
        localStorage.setItem(key, JSON.stringify(data));
        syncedCount++;
      }
    }
    // Update last sync time
    if (syncedCount > 0) {
      const config = getDatabaseConfig();
      config.lastSync = new Date().toISOString();
      localStorage.setItem(KEYS.DB_CONFIG, JSON.stringify(config));
      return true;
    }
    return true; 
  } catch (e) {
    console.error("❌ Sync failed", e);
    return false;
  }
};

export const forceSyncToCloud = async () => {
   if (!isCloudEnabled) return false;
   try {
     console.log("📤 Uploading all local data to cloud...");
     await syncDataToCloud(KEYS.USERS, JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'));
     await syncDataToCloud(KEYS.STUDENTS, JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]'));
     await syncDataToCloud(KEYS.CLASSES, JSON.parse(localStorage.getItem(KEYS.CLASSES) || '[]'));
     await syncDataToCloud(KEYS.REPORTS, JSON.parse(localStorage.getItem(KEYS.REPORTS) || '{}'));
     await syncDataToCloud(KEYS.NOTIFICATIONS, JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]'));
     await syncDataToCloud(KEYS.MESSAGES, JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]'));
     
     const config = getDatabaseConfig();
     config.lastSync = new Date().toISOString();
     localStorage.setItem(KEYS.DB_CONFIG, JSON.stringify(config));
     console.log("✅ Upload complete.");
     return true;
   } catch (e) {
     console.error("❌ Upload failed", e);
     return false;
   }
};

export const forceSyncFromCloud = async () => {
  if (!isCloudEnabled) return false;
  return await syncAllFromCloud();
};


// Users
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(KEYS.USERS);
  if (!stored) {
    return []; 
  }
  return JSON.parse(stored);
};

export const saveUsers = (users: User[]) => {
  saveAndSync(KEYS.USERS, users);
};

// Students
export const getStudents = (): Student[] => {
  const stored = localStorage.getItem(KEYS.STUDENTS);
  if (!stored) {
    return [];
  }
  return JSON.parse(stored);
};

export const saveStudents = (students: Student[]) => {
  saveAndSync(KEYS.STUDENTS, students);
};

// Classes
export const getClasses = (): ClassGroup[] => {
  const stored = localStorage.getItem(KEYS.CLASSES);
  if (!stored) {
    return [];
  }
  return JSON.parse(stored);
};

export const saveClasses = (classes: ClassGroup[]) => {
  saveAndSync(KEYS.CLASSES, classes);
};

// Reports
export const getReports = (): Record<string, DailyReport> => {
  const stored = localStorage.getItem(KEYS.REPORTS);
  if (!stored) {
    return {};
  }
  return JSON.parse(stored);
};

export const saveReports = (reports: Record<string, DailyReport>) => {
  saveAndSync(KEYS.REPORTS, reports);
};

// Notifications
export const getNotifications = (): AppNotification[] => {
  const stored = localStorage.getItem(KEYS.NOTIFICATIONS);
  if (!stored) {
    return [];
  }
  return JSON.parse(stored);
};

export const saveNotifications = (notifications: AppNotification[]) => {
  saveAndSync(KEYS.NOTIFICATIONS, notifications);
};

// Messages
export const getMessages = (): ChatMessage[] => {
  const stored = localStorage.getItem(KEYS.MESSAGES);
  if (!stored) {
    return [];
  }
  return JSON.parse(stored);
};

export const saveMessages = (messages: ChatMessage[]) => {
  saveAndSync(KEYS.MESSAGES, messages);
};
