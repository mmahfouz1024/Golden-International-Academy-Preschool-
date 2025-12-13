
import { MOCK_USERS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_REPORTS } from '../constants';
import { User, Student, ClassGroup, DailyReport, DatabaseConfig, AppNotification, ChatMessage, Post, ScheduleItem, AttendanceStatus, DailyMenu, FeeRecord, BusRoute, SchoolEvent, StaffSalary } from '../types';
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
  FEES: 'golden_academy_fees',
  TRANSPORT: 'golden_academy_transport',
  EVENTS: 'golden_academy_events',
  PAYROLL: 'golden_academy_payroll'
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
    const connected = initSupabase(config);
    isCloudEnabled = connected;

    if (!connected) {
      console.error("⚠️ Failed to initialize Supabase client.");
      return { success: false, message: 'Client Initialization Failed' };
    }

    console.log("🔗 Connecting to Supabase...");
    try {
      const { data, error } = await fetchDataFromCloud(KEYS.USERS);
      
      if (error) {
        console.error("⚠️ Database connection error:", JSON.stringify(error));
        return { success: true, message: 'Offline Mode (Connection Failed)' };
      }
      
      if (!data) {
        console.log("☁️ Database connected but empty. Seeding initial data...");
        if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
        if (!localStorage.getItem(KEYS.STUDENTS)) localStorage.setItem(KEYS.STUDENTS, JSON.stringify(MOCK_STUDENTS));
        if (!localStorage.getItem(KEYS.CLASSES)) localStorage.setItem(KEYS.CLASSES, JSON.stringify(MOCK_CLASSES));
        if (!localStorage.getItem(KEYS.REPORTS)) localStorage.setItem(KEYS.REPORTS, JSON.stringify(MOCK_REPORTS));
        if (!localStorage.getItem(KEYS.SCHEDULE)) localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(DEFAULT_SCHEDULE));
        if (!localStorage.getItem(KEYS.ATTENDANCE)) localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify({}));
        if (!localStorage.getItem(KEYS.FEES)) localStorage.setItem(KEYS.FEES, JSON.stringify([]));
        
        if (!localStorage.getItem(KEYS.TRANSPORT)) localStorage.setItem(KEYS.TRANSPORT, JSON.stringify([]));
        if (!localStorage.getItem(KEYS.EVENTS)) localStorage.setItem(KEYS.EVENTS, JSON.stringify([]));
        if (!localStorage.getItem(KEYS.PAYROLL)) localStorage.setItem(KEYS.PAYROLL, JSON.stringify([]));

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
        console.log("📥 Downloading fresh data from Cloud...");
        await syncAllFromCloud();
      }

      return { success: true, message: 'Connected' };

    } catch (error: any) {
      console.error("⚠️ Exception during DB init:", error);
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
  initSupabase(config);
  isCloudEnabled = config.isEnabled;
};

// Generic Sync Helpers
const saveAndSync = async (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
  if (isCloudEnabled) {
    syncDataToCloud(key, data).catch(err => console.error(`Failed to sync ${key}:`, err));
  }
};

const syncAllFromCloud = async () => {
  try {
    const keys = Object.values(KEYS);
    let syncedCount = 0;
    for (const key of keys) {
      const { data } = await fetchDataFromCloud(key);
      if (data) {
        localStorage.setItem(key, JSON.stringify(data));
        syncedCount++;
      }
    }
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
     const keys = Object.values(KEYS);
     for (const key of keys) {
       const raw = localStorage.getItem(key);
       const data = raw ? JSON.parse(raw) : (key === KEYS.REPORTS || key === KEYS.ATTENDANCE || key === KEYS.DAILY_MENU ? {} : []);
       await syncDataToCloud(key, data);
     }
     
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

export const syncMessages = async (): Promise<ChatMessage[]> => {
  if (isCloudEnabled) {
    try {
      const { data } = await fetchDataFromCloud(KEYS.MESSAGES);
      if (data) localStorage.setItem(KEYS.MESSAGES, JSON.stringify(data));
    } catch (e) {}
  }
  return getMessages();
};

export const syncPosts = async (): Promise<Post[]> => {
  if (isCloudEnabled) {
    try {
      const { data } = await fetchDataFromCloud(KEYS.POSTS);
      if (data) localStorage.setItem(KEYS.POSTS, JSON.stringify(data));
    } catch (e) {}
  }
  return getPosts();
};

export const createBackupData = () => {
  const backup: any = { version: '1.1', timestamp: new Date().toISOString() };
  Object.values(KEYS).forEach(key => {
      const val = localStorage.getItem(key);
      if (val) backup[key] = JSON.parse(val);
  });
  return backup;
};

export const restoreBackupData = (data: any) => {
  try {
    if (!data || typeof data !== 'object') return false;
    
    Object.values(KEYS).forEach(key => {
        if (data[key]) localStorage.setItem(key, JSON.stringify(data[key]));
    });

    if (isCloudEnabled) {
       forceSyncToCloud().catch(err => console.error("Auto-sync after restore failed", err));
    }
    return true;
  } catch (e) {
    console.error("Restore failed", e);
    return false;
  }
};

// --- DATA ACCESSORS ---

export const getUsers = (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
export const saveUsers = (users: User[]) => saveAndSync(KEYS.USERS, users);

export const getStudents = (): Student[] => JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
export const saveStudents = (students: Student[]) => saveAndSync(KEYS.STUDENTS, students);

export const getClasses = (): ClassGroup[] => JSON.parse(localStorage.getItem(KEYS.CLASSES) || '[]');
export const saveClasses = (classes: ClassGroup[]) => saveAndSync(KEYS.CLASSES, classes);

export const getReports = (): Record<string, DailyReport> => JSON.parse(localStorage.getItem(KEYS.REPORTS) || '{}');
export const saveReports = (reports: Record<string, DailyReport>) => saveAndSync(KEYS.REPORTS, reports);

export const getNotifications = (): AppNotification[] => JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
export const saveNotifications = (notifications: AppNotification[]) => saveAndSync(KEYS.NOTIFICATIONS, notifications);

export const getMessages = (): ChatMessage[] => JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
export const saveMessages = (messages: ChatMessage[]) => saveAndSync(KEYS.MESSAGES, messages);

export const getPosts = (): Post[] => JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
export const savePosts = (posts: Post[]) => saveAndSync(KEYS.POSTS, posts);

export const getSchedule = (): ScheduleItem[] => JSON.parse(localStorage.getItem(KEYS.SCHEDULE) || JSON.stringify(DEFAULT_SCHEDULE));
export const saveSchedule = (schedule: ScheduleItem[]) => saveAndSync(KEYS.SCHEDULE, schedule);

export const getAttendanceHistory = (): Record<string, Record<string, AttendanceStatus>> => JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '{}');
export const saveAttendanceHistory = (history: Record<string, Record<string, AttendanceStatus>>) => saveAndSync(KEYS.ATTENDANCE, history);

export const getDailyMenu = (): DailyMenu => {
  const stored = localStorage.getItem(KEYS.DAILY_MENU);
  const today = new Date().toISOString().split('T')[0];
  const emptyMenu: DailyMenu = { date: today, breakfast: '', lunch: '', snack: '' };
  if (!stored) return emptyMenu;
  const menu = JSON.parse(stored);
  if (menu.date !== today) return emptyMenu;
  return menu;
};
export const saveDailyMenu = (menu: DailyMenu) => saveAndSync(KEYS.DAILY_MENU, menu);

export const getFees = (): FeeRecord[] => JSON.parse(localStorage.getItem(KEYS.FEES) || '[]');
export const saveFees = (fees: FeeRecord[]) => saveAndSync(KEYS.FEES, fees);

export const getTransportRoutes = (): BusRoute[] => JSON.parse(localStorage.getItem(KEYS.TRANSPORT) || '[]');
export const saveTransportRoutes = (routes: BusRoute[]) => saveAndSync(KEYS.TRANSPORT, routes);

export const getEvents = (): SchoolEvent[] => JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
export const saveEvents = (events: SchoolEvent[]) => saveAndSync(KEYS.EVENTS, events);

export const getPayroll = (): StaffSalary[] => JSON.parse(localStorage.getItem(KEYS.PAYROLL) || '[]');
export const savePayroll = (payroll: StaffSalary[]) => saveAndSync(KEYS.PAYROLL, payroll);
