
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

export const initStorage = async () => {
  const config = getDatabaseConfig();
  if (config.isEnabled && config.url && config.key) {
    const connected = initSupabase(config);
    isCloudEnabled = connected;
    if (connected && config.autoSync) {
      await syncAllFromCloud();
    }
  }
};

// Database Config
export const getDatabaseConfig = (): DatabaseConfig => {
  const stored = localStorage.getItem(KEYS.DB_CONFIG);
  if (!stored) {
    return { isEnabled: false, url: '', key: '', autoSync: false };
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
    // Fire and forget sync to avoid UI blocking, or handle error silently
    syncDataToCloud(key, data).catch(console.error);
  }
};

const syncAllFromCloud = async () => {
  try {
    const keys = [KEYS.USERS, KEYS.STUDENTS, KEYS.CLASSES, KEYS.REPORTS];
    for (const key of keys) {
      const { data } = await fetchDataFromCloud(key);
      if (data) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    }
    // Update last sync time
    const config = getDatabaseConfig();
    config.lastSync = new Date().toISOString();
    saveDatabaseConfig(config);
    return true;
  } catch (e) {
    console.error("Sync failed", e);
    return false;
  }
};

export const forceSyncToCloud = async () => {
   if (!isCloudEnabled) return false;
   try {
     await syncDataToCloud(KEYS.USERS, getUsers());
     await syncDataToCloud(KEYS.STUDENTS, getStudents());
     await syncDataToCloud(KEYS.CLASSES, getClasses());
     await syncDataToCloud(KEYS.REPORTS, getReports());
     
     const config = getDatabaseConfig();
     config.lastSync = new Date().toISOString();
     saveDatabaseConfig(config);
     return true;
   } catch (e) {
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
