
import { MOCK_USERS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_REPORTS } from '../constants';
import { User, Student, ClassGroup, DailyReport, DatabaseConfig, AppNotification, ChatMessage, Post, ScheduleItem, AttendanceStatus, DailyMenu, FeeRecord } from '../types';
import { initSupabase, syncDataToCloud, fetchDataFromCloud } from './supabaseClient';

const KEYS = {
  USERS: 'golden_academy_users',
  STUDENTS: 'golden_academy_students',
  CLASSES: 'golden_academy_classes',
  REPORTS: 'golden_academy_reports',
  DB_CONFIG: 'golden_academy_db_config',
  NOTIFICATIONS: 'golden_academy_notifications',
  MESSAGES: 'golden_academy_messages',
  POSTS: 'golden_academy_posts',
  SCHEDULE: 'golden_academy_schedule',
  ATTENDANCE: 'golden_academy_attendance_history',
  DAILY_MENU: 'golden_academy_daily_menu',
  FEES: 'golden_academy_fees'
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

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: '1', time: '08:00', title: 'Arrival & Reception', color: 'green' },
  { id: '2', time: '09:00', title: 'Morning Circle', color: 'blue' },
  { id: '3', time: '10:30', title: 'Breakfast', color: 'orange' },
  { id: '4', time: '11:00', title: 'Free Play', color: 'purple' },
];

export const initStorage = async (): Promise<{ success: boolean; message?: string }> => {
  const config = getDatabaseConfig();
  
  // Update local config to defaults if missing key parts (healing step for existing users)
  if (config.isEnabled && (!config.url || !config.key)) {
     config.url = DEFAULT_CONFIG.url;
     config.key = DEFAULT_CONFIG.key;
     saveDatabaseConfig(config);
  }

  if (config.isEnabled && config.url && config.key) {
    // MODIFIED: Do NOT clear local storage here. 
    // This allows local state (like read notifications) to persist before cloud sync overwrites it.
    // We trust local data first for immediate UI rendering (Offline First approach).

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
        console.error("⚠️ Database connection error:", JSON.stringify(error));
        // Allow app to continue in "Offline/Local Mode" if DB fails, instead of blocking
        // This ensures notifications stay read if internet is down
        return { success: true, message: 'Offline Mode (Connection Failed)' };
      }
      
      // 2. Data Logic
      if (!data) {
        // DB is connected but empty. 
        console.log("☁️ Database connected but empty. Seeding initial data...");
        
        // Ensure we have defaults locally before seeding
        if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
        if (!localStorage.getItem(KEYS.STUDENTS)) localStorage.setItem(KEYS.STUDENTS, JSON.stringify(MOCK_STUDENTS));
        if (!localStorage.getItem(KEYS.CLASSES)) localStorage.setItem(KEYS.CLASSES, JSON.stringify(MOCK_CLASSES));
        if (!localStorage.getItem(KEYS.REPORTS)) localStorage.setItem(KEYS.REPORTS, JSON.stringify(MOCK_REPORTS));
        if (!localStorage.getItem(KEYS.SCHEDULE)) localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(DEFAULT_SCHEDULE));
        if (!localStorage.getItem(KEYS.ATTENDANCE)) localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify({}));
        if (!localStorage.getItem(KEYS.FEES)) localStorage.setItem(KEYS.FEES, JSON.stringify([]));
        
        // Seed default notification only if missing
        if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
            const defaultNotifications: AppNotification[] = [{
              id: '1',
              title: 'Welcome',
              message: 'Welcome to Golden International Academy System',
              time: new Date().toISOString(),
              isRead: false,
              type: 'info'
            }];
            localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(defaultNotifications));
        }
        
        const seeded = await forceSyncToCloud();
        if (!seeded) {
             return { success: false, message: 'Failed to seed database' };
        }
      } else {
        // 3. Data exists in Cloud. Sync it DOWN.
        // We sync down, but since we didn't wipe local storage, this acts as a refresh.
        // Ideally, conflict resolution should happen here, but for this app, Cloud wins for shared data.
        // For User-Specific data (like read receipts in notifications), we rely on the fact that notifications
        // are pushed to cloud after modification in NotificationContext.
        console.log("📥 Downloading fresh data from Cloud...");
        await syncAllFromCloud();
      }

      return { success: true, message: 'Connected' };

    } catch (error: any) {
      console.error("⚠️ Exception during DB init:", error);
      // Fallback to success to allow local usage
      return { success: true, message: 'Offline Mode' };
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
    const keys = [KEYS.USERS, KEYS.STUDENTS, KEYS.CLASSES, KEYS.REPORTS, KEYS.NOTIFICATIONS, KEYS.MESSAGES, KEYS.POSTS, KEYS.SCHEDULE, KEYS.ATTENDANCE, KEYS.DAILY_MENU, KEYS.FEES];
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
     await syncDataToCloud(KEYS.POSTS, JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]'));
     await syncDataToCloud(KEYS.SCHEDULE, JSON.parse(localStorage.getItem(KEYS.SCHEDULE) || JSON.stringify(DEFAULT_SCHEDULE)));
     await syncDataToCloud(KEYS.ATTENDANCE, JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '{}'));
     await syncDataToCloud(KEYS.DAILY_MENU, JSON.parse(localStorage.getItem(KEYS.DAILY_MENU) || '{}'));
     await syncDataToCloud(KEYS.FEES, JSON.parse(localStorage.getItem(KEYS.FEES) || '[]'));
     
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

/**
 * Specifically sync messages for real-time chat.
 */
export const syncMessages = async (): Promise<ChatMessage[]> => {
  if (isCloudEnabled) {
    try {
      const { data } = await fetchDataFromCloud(KEYS.MESSAGES);
      if (data) {
        localStorage.setItem(KEYS.MESSAGES, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Background message sync failed", e);
    }
  }
  return getMessages();
};

/**
 * Specifically sync posts for real-time dashboard updates.
 */
export const syncPosts = async (): Promise<Post[]> => {
  if (isCloudEnabled) {
    try {
      const { data } = await fetchDataFromCloud(KEYS.POSTS);
      if (data) {
        localStorage.setItem(KEYS.POSTS, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Background post sync failed", e);
    }
  }
  return getPosts();
};

// --- BACKUP AND RESTORE FUNCTIONS ---

export const createBackupData = () => {
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    users: getUsers(),
    students: getStudents(),
    classes: getClasses(),
    reports: getReports(),
    notifications: getNotifications(),
    messages: getMessages(),
    posts: getPosts(),
    schedule: getSchedule(),
    attendance: getAttendanceHistory(),
    dailyMenu: getDailyMenu(),
    fees: getFees(),
  };
  return backup;
};

export const restoreBackupData = (data: any) => {
  try {
    // Basic validation
    if (!data || typeof data !== 'object') return false;
    
    // Restore logic
    if (data.users) localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
    if (data.students) localStorage.setItem(KEYS.STUDENTS, JSON.stringify(data.students));
    if (data.classes) localStorage.setItem(KEYS.CLASSES, JSON.stringify(data.classes));
    if (data.reports) localStorage.setItem(KEYS.REPORTS, JSON.stringify(data.reports));
    if (data.notifications) localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
    if (data.messages) localStorage.setItem(KEYS.MESSAGES, JSON.stringify(data.messages));
    if (data.posts) localStorage.setItem(KEYS.POSTS, JSON.stringify(data.posts));
    if (data.schedule) localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(data.schedule));
    if (data.attendance) localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(data.attendance));
    if (data.dailyMenu) localStorage.setItem(KEYS.DAILY_MENU, JSON.stringify(data.dailyMenu));
    if (data.fees) localStorage.setItem(KEYS.FEES, JSON.stringify(data.fees));

    if (isCloudEnabled) {
       forceSyncToCloud().catch(err => console.error("Auto-sync after restore failed", err));
    }

    return true;
  } catch (e) {
    console.error("Restore failed", e);
    return false;
  }
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

// Posts
export const getPosts = (): Post[] => {
  const stored = localStorage.getItem(KEYS.POSTS);
  if (!stored) {
    return [];
  }
  return JSON.parse(stored);
};

export const savePosts = (posts: Post[]) => {
  saveAndSync(KEYS.POSTS, posts);
};

// Schedule
export const getSchedule = (): ScheduleItem[] => {
  const stored = localStorage.getItem(KEYS.SCHEDULE);
  if (!stored) {
    return DEFAULT_SCHEDULE;
  }
  return JSON.parse(stored);
};

export const saveSchedule = (schedule: ScheduleItem[]) => {
  saveAndSync(KEYS.SCHEDULE, schedule);
};

// Attendance History
export const getAttendanceHistory = (): Record<string, Record<string, AttendanceStatus>> => {
  const stored = localStorage.getItem(KEYS.ATTENDANCE);
  if (!stored) {
    return {};
  }
  return JSON.parse(stored);
};

export const saveAttendanceHistory = (history: Record<string, Record<string, AttendanceStatus>>) => {
  saveAndSync(KEYS.ATTENDANCE, history);
};

// Daily Menu
export const getDailyMenu = (): DailyMenu => {
  const stored = localStorage.getItem(KEYS.DAILY_MENU);
  const today = new Date().toISOString().split('T')[0];
  const emptyMenu: DailyMenu = { date: today, breakfast: '', lunch: '', snack: '' };

  if (!stored) return emptyMenu;
  
  const menu = JSON.parse(stored);
  // Reset if it's a new day
  if (menu.date !== today) {
      return emptyMenu;
  }
  return menu;
};

export const saveDailyMenu = (menu: DailyMenu) => {
  saveAndSync(KEYS.DAILY_MENU, menu);
};

// Fees
export const getFees = (): FeeRecord[] => {
  const stored = localStorage.getItem(KEYS.FEES);
  if (!stored) {
    return [];
  }
  return JSON.parse(stored);
};

export const saveFees = (fees: FeeRecord[]) => {
  saveAndSync(KEYS.FEES, fees);
};
