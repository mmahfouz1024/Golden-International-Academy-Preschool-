
export enum StudentStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending'
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
  id: string;
  name: string;
  age: number;
  classGroup: string;
  parentName: string;
  phone: string;
  status: StudentStatus;
  attendanceToday: boolean;
  avatar: string;
  birthday?: string;
}

export interface ActivityPlan {
  title: string;
  ageGroup: string;
  duration: string;
  materials: string[];
  steps: string[];
  learningOutcomes: string;
  notes?: string;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  totalTeachers: number;
}

export type Mood = 'happy' | 'sad' | 'neutral' | 'excited' | 'tired' | 'sick';
export type MealStatus = 'all' | 'some' | 'none';
export type BathroomType = 'urine' | 'stool';

export interface DailyReport {
  id: string;
  studentId: string;
  date: string;
  mood: Mood;
  moodNotes?: string;
  meals: {
    breakfast: MealStatus;
    breakfastDetails?: string[]; 
    lunch: MealStatus;
    lunchDetails?: string[];     
    snack: MealStatus;
    snackDetails?: string[];     
    waterCups: number;
    notes?: string;
  };
  bathroom: {
    time: string;
    type: BathroomType;
    notes?: string;
  }[];
  nap: {
    slept: boolean;
    duration?: string; // e.g. "1h 30m"
    notes?: string;
  };
  academic?: {
    religion?: string[];
    arabic?: string[];
    english?: string[];
    math?: string[];
  };
  activities: string[];
  photos?: string[]; // Array of base64 strings or URLs
  notes: string;
}

export type UserRole = 'admin' | 'manager' | 'teacher' | 'parent';

export interface User {
  id: string;
  username: string;
  password?: string; // In real app, never store plain password
  name: string;
  role: UserRole;
  permissions?: string[]; // Array of allowed view IDs (e.g., ['dashboard', 'students'])
  linkedStudentId?: string; // Legacy: Single child
  linkedStudentIds?: string[]; // New: Multiple children support
  avatar?: string;
  email?: string;
  phone?: string;
  interests?: string[];
  assignedClassIds?: string[];
}

export interface ClassGroup {
  id: string;
  name: string;
  ageRange: string;
  teacherId?: string;
  capacity: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  date: string;
  isPinned?: boolean;
}

export type Theme = 'smart' | 'blossom' | 'garden' | 'sunshine';

export interface DatabaseConfig {
  isEnabled: boolean;
  url: string;
  key: string;
  autoSync: boolean;
  lastSync?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  color: 'green' | 'blue' | 'orange' | 'purple' | 'red';
}
