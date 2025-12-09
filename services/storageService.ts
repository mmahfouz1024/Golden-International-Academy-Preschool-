

import { MOCK_USERS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_REPORTS } from '../constants';
import { User, Student, ClassGroup, DailyReport, DatabaseConfig } from '../types';
import { initSupabase, syncDataToCloud, fetchDataFromCloud } from './supabaseClient';

const KEYS = {
  USERS: 'golden_academy_users',
  STUDENTS: 'golden_academy_students',
  CLASSES: 'golden_academy_classes',
  REPORTS: 'golden_academy_reports',
  DB_CONFIG: 'golden_academy_db_config'
};

// Initialize DB
let isCloudEnabled = false;

// Default Credentials from user request
const DEFAULT_CONFIG: DatabaseConfig = {
  isEnabled: true,
  url: 'https://jompzhrrgazbsqoetdbh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXB6aHJyZ2F6YnNxb2V0ZGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzkzNDMsImV4cCI6MjA4MDg1NTM0M30.av1WThwU7L0WeUHPzw29bt-OL-esWH-OihZJCIgXbAc',
  autoSync: true
};

export const initStorage = async (): Promise<{ success: boolean; message?: string }> => {
  const config = getDatabaseConfig();
  
  if (config.isEnabled && config.url && config.key) {
    const connected = initSupabase(config);
    isCloudEnabled = connected;

    if (!connected) {
      console.error("⚠️ Failed to initialize Supabase client with provided keys.");
      return { success: false, message: 'Invalid URL or Key format' };
    }

    if (config.autoSync) {
      console.log("🔗 Connected to Supabase. Checking for remote data...");
      try {
        // Try to fetch users to see if DB is initialized and readable
        const { data, error } = await fetchDataFromCloud(KEYS.USERS);
        
        if (error) {
          // If we get an error (like connection refused, 404, or invalid key), we report it
          console.error("⚠️ Error reading from Supabase:", error);
          return { success: false, message: error.message || 'Connection Error' };
        }
        
        if (!data) {
          console.log("☁️ Database appears empty. Seeding with local/mock data...");
          const seeded = await forceSyncToCloud();
          if (!seeded) return { success: false, message: 'Failed to seed database' };
        } else {
          console.log("📥 Data found in cloud. Syncing down to device...");
          const synced = await syncAllFromCloud();
          if (!synced) return { success: false, message: 'Failed to sync data' };
        }

        return { success: true, message: 'Connected' };

      } catch (error: any) {
        console.error("⚠️ Exception during initial sync check:", error);
        return { success: false, message: error?.message || 'Unknown connection error' };
      }
    }
    return { success: true, message: 'Connected (Auto-sync disabled)' };
  }
  
  // If disabled, we still consider initialization a "success" (local mode)
  return { success: true, message: 'Local Mode' };
};

// Database Config
export const getDatabaseConfig = (): DatabaseConfig => {
  const stored = localStorage.getItem(KEYS.DB_CONFIG);
  if (!stored) {
    // If no config exists, use the defaults and save them so they appear in settings
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
    const keys = [KEYS.USERS, KEYS.STUDENTS, KEYS.CLASSES, KEYS.REPORTS];
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
      saveDatabaseConfig(config);
      console.log("✅ Sync from cloud complete.");
      return true;
    }
    return false;
  } catch (e) {
    console.error("❌ Sync failed", e);
    return false;
  }
};

export const forceSyncToCloud = async () => {
   if (!isCloudEnabled) return false;
   try {
     console.log("📤 Uploading all local data to cloud...");
     await syncDataToCloud(KEYS.USERS, getUsers());
     await syncDataToCloud(KEYS.STUDENTS, getStudents());
     await syncDataToCloud(KEYS.CLASSES, getClasses());
     await syncDataToCloud(KEYS.REPORTS, getReports());
     
     const config = getDatabaseConfig();
     config.lastSync = new Date().toISOString();
     saveDatabaseConfig(config);
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
    localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
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
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(MOCK_STUDENTS));
    return MOCK_STUDENTS;
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
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(MOCK_CLASSES));
    return MOCK_CLASSES;
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
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(MOCK_REPORTS));
    return MOCK_REPORTS;
  }
  return JSON.parse(stored);
};

export const saveReports = (reports: Record<string, DailyReport>) => {
  saveAndSync(KEYS.REPORTS, reports);
};
