
import { Student, StudentStatus, DailyReport, User, ClassGroup } from './types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Ahmed Mohamed',
    age: 4,
    classGroup: 'Buds',
    parentName: 'Mohamed Ali',
    phone: '0501234567',
    status: StudentStatus.Active,
    attendanceToday: true,
    avatar: 'https://picsum.photos/seed/child1/200/200'
  },
  {
    id: '2',
    name: 'Sarah Khaled',
    age: 5,
    classGroup: 'Stars',
    parentName: 'Khaled Hassan',
    phone: '0509876543',
    status: StudentStatus.Active,
    attendanceToday: true,
    avatar: 'https://picsum.photos/seed/child2/200/200'
  },
  {
    id: '3',
    name: 'Youssef Omar',
    age: 3,
    classGroup: 'Birds',
    parentName: 'Omar Farouk',
    phone: '0501112223',
    status: StudentStatus.Pending,
    attendanceToday: false,
    avatar: 'https://picsum.photos/seed/child3/200/200'
  },
  {
    id: '4',
    name: 'Laila Ahmed',
    age: 4,
    classGroup: 'Buds',
    parentName: 'Ahmed Mahmoud',
    phone: '0503334445',
    status: StudentStatus.Active,
    attendanceToday: false,
    avatar: 'https://picsum.photos/seed/child4/200/200'
  },
  {
    id: '5',
    name: 'Karim Samy',
    age: 5,
    classGroup: 'Stars',
    parentName: 'Samy Youssef',
    phone: '0505556667',
    status: StudentStatus.Inactive,
    attendanceToday: false,
    avatar: 'https://picsum.photos/seed/child5/200/200'
  }
];

export const ATTENDANCE_DATA = [
  { name: 'Sun', present: 20, absent: 2 },
  { name: 'Mon', present: 18, absent: 4 },
  { name: 'Tue', present: 22, absent: 0 },
  { name: 'Wed', present: 19, absent: 3 },
  { name: 'Thu', present: 21, absent: 1 },
];

export const AGE_GROUPS = [
  "3-4 Years (Birds)",
  "4-5 Years (Buds)",
  "5-6 Years (Stars)"
];

const today = new Date().toISOString().split('T')[0];
// Helper to get yesterday's date
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const MOCK_REPORTS: Record<string, DailyReport> = {
  [`1_${today}`]: {
    id: `r1_${today}`,
    studentId: '1',
    date: today,
    mood: 'happy',
    moodNotes: '',
    meals: {
      breakfast: 'all',
      breakfastDetails: ['Cheese Sandwich', 'Milk'],
      lunch: 'some',
      lunchDetails: ['Rice', 'Chicken'],
      snack: 'all',
      snackDetails: ['Apple'],
      waterCups: 4,
      notes: ''
    },
    bathroom: {
      urine: 2,
      stool: 1,
      notes: 'Normal'
    },
    nap: {
      slept: true,
      duration: '45 mins',
      notes: ''
    },
    activities: ['Drawing', 'Playground', 'Story Time'],
    photos: ['https://picsum.photos/seed/act1/400/300', 'https://picsum.photos/seed/act2/400/300'],
    notes: 'Ahmed was very cooperative today.'
  },
  [`2_${today}`]: {
    id: `r2_${today}`,
    studentId: '2',
    date: today,
    mood: 'excited',
    moodNotes: '',
    meals: {
      breakfast: 'some',
      breakfastDetails: ['Toast'],
      lunch: 'all',
      lunchDetails: ['Pasta'],
      snack: 'none',
      snackDetails: [],
      waterCups: 3,
      notes: ''
    },
    bathroom: {
      urine: 1,
      stool: 0,
      notes: ''
    },
    nap: {
      slept: false,
      notes: ''
    },
    activities: ['Building Blocks', 'Singing'],
    photos: [],
    notes: ''
  },
  // Historical Report for Ahmed (Yesterday)
  [`1_${yesterday}`]: {
    id: `r1_${yesterday}`,
    studentId: '1',
    date: yesterday,
    mood: 'tired',
    moodNotes: 'Did not sleep well at home',
    meals: {
      breakfast: 'none',
      breakfastDetails: [],
      lunch: 'some',
      lunchDetails: ['Vegetables'],
      snack: 'some',
      snackDetails: ['Biscuit'],
      waterCups: 2,
      notes: 'No appetite'
    },
    bathroom: {
      urine: 3,
      stool: 0,
      notes: ''
    },
    nap: {
      slept: true,
      duration: '1h 30m',
      notes: 'Slept deeply'
    },
    activities: ['Sand Play'],
    photos: [],
    notes: 'He was quiet today.'
  }
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: '123',
    name: 'Ms. Fatima',
    role: 'admin',
    avatar: 'https://picsum.photos/seed/admin/100/100',
    email: 'fatima@goldenacademy.com',
    phone: '0501111111',
    interests: ['Education', 'Management', 'Reading']
  },
  {
    id: 'u2',
    username: 'parent1', // Parent for Ahmed
    password: '123',
    name: 'Ahmed\'s Dad',
    role: 'parent',
    linkedStudentId: '1',
    avatar: 'https://picsum.photos/seed/parent1/100/100',
    email: 'ahmed.dad@gmail.com',
    phone: '0502222222',
    interests: ['Football', 'Tech']
  },
  {
    id: 'u3',
    username: 'parent2', // Parent for Sarah
    password: '123',
    name: 'Sarah\'s Dad',
    role: 'parent',
    linkedStudentId: '2',
    avatar: 'https://picsum.photos/seed/parent2/100/100',
    email: 'sarah.dad@gmail.com',
    phone: '0503333333',
    interests: []
  }
];

export const MOCK_CLASSES: ClassGroup[] = [
  {
    id: 'c1',
    name: 'Birds',
    ageRange: '3-4',
    teacherId: 'u1', // Assign admin as teacher for demo
    capacity: 15
  },
  {
    id: 'c2',
    name: 'Buds',
    ageRange: '4-5',
    capacity: 20
  },
  {
    id: 'c3',
    name: 'Stars',
    ageRange: '5-6',
    capacity: 20
  }
];
