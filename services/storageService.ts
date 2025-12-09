
import { MOCK_USERS, MOCK_STUDENTS, MOCK_CLASSES, MOCK_REPORTS } from '../constants';
import { User, Student, ClassGroup, DailyReport } from '../types';

const KEYS = {
  USERS: 'golden_academy_users',
  STUDENTS: 'golden_academy_students',
  CLASSES: 'golden_academy_classes',
  REPORTS: 'golden_academy_reports'
};

// Users
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(KEYS.USERS);
  if (!stored) {
    // Initialize with mock data if empty
    localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
  return JSON.parse(stored);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
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
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
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
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
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
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
};
