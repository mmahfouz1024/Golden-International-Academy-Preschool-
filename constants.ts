import { Student, StudentStatus, DailyReport, User, ClassGroup } from './types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'أحمد محمد',
    age: 4,
    classGroup: 'العصافير',
    parentName: 'محمد علي',
    phone: '0501234567',
    status: StudentStatus.Active,
    attendanceToday: true,
    avatar: 'https://picsum.photos/seed/child1/200/200'
  },
  {
    id: '2',
    name: 'سارة خالد',
    age: 5,
    classGroup: 'النجوم',
    parentName: 'خالد حسن',
    phone: '0509876543',
    status: StudentStatus.Active,
    attendanceToday: true,
    avatar: 'https://picsum.photos/seed/child2/200/200'
  },
  {
    id: '3',
    name: 'يوسف عمر',
    age: 3,
    classGroup: 'البراعم',
    parentName: 'عمر فاروق',
    phone: '0501112223',
    status: StudentStatus.Pending,
    attendanceToday: false,
    avatar: 'https://picsum.photos/seed/child3/200/200'
  },
  {
    id: '4',
    name: 'ليلى أحمد',
    age: 4,
    classGroup: 'العصافير',
    parentName: 'أحمد محمود',
    phone: '0503334445',
    status: StudentStatus.Active,
    attendanceToday: false,
    avatar: 'https://picsum.photos/seed/child4/200/200'
  },
  {
    id: '5',
    name: 'كريم سامي',
    age: 5,
    classGroup: 'النجوم',
    parentName: 'سامي يوسف',
    phone: '0505556667',
    status: StudentStatus.Inactive,
    attendanceToday: false,
    avatar: 'https://picsum.photos/seed/child5/200/200'
  }
];

export const ATTENDANCE_DATA = [
  { name: 'الأحد', present: 20, absent: 2 },
  { name: 'الاثنين', present: 18, absent: 4 },
  { name: 'الثلاثاء', present: 22, absent: 0 },
  { name: 'الأربعاء', present: 19, absent: 3 },
  { name: 'الخميس', present: 21, absent: 1 },
];

export const AGE_GROUPS = [
  "3-4 سنوات (البراعم)",
  "4-5 سنوات (العصافير)",
  "5-6 سنوات (النجوم)"
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
      lunch: 'some',
      snack: 'all',
      waterCups: 4,
      notes: ''
    },
    bathroom: [
      { time: '09:30', type: 'urine' },
      { time: '11:15', type: 'stool', notes: 'طبيعي' }
    ],
    nap: {
      slept: true,
      duration: '45 دقيقة',
      notes: ''
    },
    activities: ['الرسم والتلوين', 'اللعب في الحديقة', 'حلقة القرآن'],
    photos: ['https://picsum.photos/seed/act1/400/300', 'https://picsum.photos/seed/act2/400/300'],
    notes: 'كان أحمد متعاوناً جداً اليوم مع أصدقائه.'
  },
  [`2_${today}`]: {
    id: `r2_${today}`,
    studentId: '2',
    date: today,
    mood: 'excited',
    moodNotes: '',
    meals: {
      breakfast: 'some',
      lunch: 'all',
      snack: 'none',
      waterCups: 3,
      notes: ''
    },
    bathroom: [
      { time: '10:00', type: 'urine' }
    ],
    nap: {
      slept: false,
      notes: ''
    },
    activities: ['تركيب المكعبات', 'الأناشيد'],
    photos: [],
    notes: ''
  },
  // Historical Report for Ahmed (Yesterday)
  [`1_${yesterday}`]: {
    id: `r1_${yesterday}`,
    studentId: '1',
    date: yesterday,
    mood: 'tired',
    moodNotes: 'لم ينم جيداً في المنزل',
    meals: {
      breakfast: 'none',
      lunch: 'some',
      snack: 'some',
      waterCups: 2,
      notes: 'لم تكن لديه شهية'
    },
    bathroom: [
      { time: '10:30', type: 'urine' }
    ],
    nap: {
      slept: true,
      duration: '1h 30m',
      notes: 'نام بعمق'
    },
    activities: ['اللعب بالرمل'],
    photos: [],
    notes: 'كان هادئاً اليوم.'
  }
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: '123',
    name: 'أ. فاطمة',
    role: 'admin',
    avatar: 'https://picsum.photos/seed/admin/100/100',
    email: 'fatima@goldenacademy.com',
    phone: '0501111111',
    interests: ['التربية الحديثة', 'الإدارة', 'القراءة']
  },
  {
    id: 'u2',
    username: 'parent1', // Parent for Ahmed
    password: '123',
    name: 'أبو أحمد',
    role: 'parent',
    linkedStudentId: '1',
    avatar: 'https://picsum.photos/seed/parent1/100/100',
    email: 'ahmed.dad@gmail.com',
    phone: '0502222222',
    interests: ['كرة القدم', 'التقنية']
  },
  {
    id: 'u3',
    username: 'parent2', // Parent for Sarah
    password: '123',
    name: 'أبو سارة',
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
    name: 'البراعم',
    ageRange: '3-4',
    teacherId: 'u1', // Assign admin as teacher for demo
    capacity: 15
  },
  {
    id: 'c2',
    name: 'العصافير',
    ageRange: '4-5',
    capacity: 20
  },
  {
    id: 'c3',
    name: 'النجوم',
    ageRange: '5-6',
    capacity: 20
  }
];