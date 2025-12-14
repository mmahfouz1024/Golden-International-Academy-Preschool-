
import React, { useState, useEffect } from 'react';
import { Check, X, Save, Coffee, ChevronDown, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getStudents, getReports, saveReports, getAttendanceHistory, saveAttendanceHistory, getClasses, getUsers } from '../services/storageService';
import { Student, AttendanceStatus, MealStatus } from '../types';

const TeacherFocusMode: React.FC = () => {
  const { t, language } = useLanguage();
  const { addNotification } = useNotification();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStr] = useState(new Date().toISOString().split('T')[0]);

  // Batch States
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [meals, setMeals] = useState<Record<string, MealStatus>>({});
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    // 1. Get Teacher's assigned classes or all classes if admin
    const currentUser = getUsers().find(u => u.id === localStorage.getItem('golden_session_uid'));
    const allClasses = getClasses();
    
    let relevantClassNames: string[] = [];
    if (currentUser?.role === 'teacher') {
       relevantClassNames = allClasses.filter(c => c.teacherId === currentUser.id).map(c => c.name);
       // If no explicitly assigned classes, fallback to all (demo mode)
       if (relevantClassNames.length === 0) relevantClassNames = allClasses.map(c => c.name);
    } else {
       relevantClassNames = allClasses.map(c => c.name);
    }
    
    setClasses(relevantClassNames);
    if (relevantClassNames.length > 0) setSelectedClass(relevantClassNames[0]);

    // 2. Load Student Data
    const allStudents = getStudents();
    
    // Filter by class
    const classStudents = allStudents.filter(s => 
        relevantClassNames.length > 0 ? s.classGroup === (selectedClass || relevantClassNames[0]) : true
    );
    
    setStudents(classStudents);

    // 3. Load Existing Data for Today
    const history = getAttendanceHistory();
    const reports = getReports();
    
    const initialAttendance: Record<string, AttendanceStatus> = {};
    const initialMeals: Record<string, MealStatus> = {};

    classStudents.forEach(s => {
        // Attendance
        if (history[todayStr] && history[todayStr][s.id]) {
            initialAttendance[s.id] = history[todayStr][s.id];
        } else {
            initialAttendance[s.id] = 'present'; // Default to present
        }

        // Meals (Check report for lunch status as main indicator)
        const reportKey = `${s.id}_${todayStr}`;
        if (reports[reportKey]) {
            initialMeals[s.id] = reports[reportKey].meals.lunch;
        } else {
            initialMeals[s.id] = 'all'; // Default to ate all
        }
    });

    setAttendance(initialAttendance);
    setMeals(initialMeals);
    setLoading(false);

  }, [selectedClass, todayStr]);

  const toggleAttendance = (studentId: string) => {
      setAttendance(prev => ({
          ...prev,
          [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
      }));
      setHasSaved(false);
  };

  const cycleMeal = (studentId: string) => {
      setMeals(prev => {
          const current = prev[studentId];
          let next: MealStatus = 'all';
          if (current === 'all') next = 'some';
          else if (current === 'some') next = 'none';
          else next = 'all';
          return { ...prev, [studentId]: next };
      });
      setHasSaved(false);
  };

  const markRestPresent = () => {
      setAttendance(prev => {
          const updated = { ...prev };
          students.forEach(s => updated[s.id] = 'present');
          return updated;
      });
      setHasSaved(false);
  };

  const saveAll = () => {
      // 1. Save Attendance
      const history = getAttendanceHistory();
      history[todayStr] = { ...history[todayStr], ...attendance };
      saveAttendanceHistory(history);

      // 2. Save/Create Reports with Meal Data
      const allReports = getReports();
      const updatedReports = { ...allReports };

      students.forEach(s => {
          // Skip absent students for meals report if desired, but let's just save for now
          // If absent, we probably shouldn't set meal to 'all', but 'none' logically
          const currentMealStatus = attendance[s.id] === 'absent' ? 'none' : meals[s.id];

          const reportKey = `${s.id}_${todayStr}`;
          if (updatedReports[reportKey]) {
              // Update existing
              updatedReports[reportKey] = {
                  ...updatedReports[reportKey],
                  meals: {
                      ...updatedReports[reportKey].meals,
                      lunch: currentMealStatus, // Simplification: Focus mode updates 'Lunch' primarily
                      // Also update others to match for simplicity or leave as is?
                      // Let's assume Focus Mode Lunch represents the main meal
                  }
              };
          } else {
              // Create new simple report
              updatedReports[reportKey] = {
                  id: `rep-${Date.now()}-${s.id}`,
                  studentId: s.id,
                  date: todayStr,
                  mood: 'neutral',
                  meals: {
                      breakfast: 'all', // Default assumptions
                      lunch: currentMealStatus,
                      snack: 'all',
                      waterCups: 2,
                      breakfastDetails: [], lunchDetails: [], snackDetails: []
                  },
                  bathroom: { urine: 0, stool: 0, notes: '' },
                  nap: { slept: false, notes: '' },
                  academic: { religion:[], arabic:[], english:[], math:[] },
                  activities: [],
                  photos: [],
                  notes: ''
              };
          }
      });

      saveReports(updatedReports);
      setHasSaved(true);
      addNotification(t('savedSuccessfully'), t('changesSaved'), 'success');
      setTimeout(() => setHasSaved(false), 3000);
  };

  if (loading) return <div className="p-10 text-center">{t('loading')}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
        
        {/* Header & Controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('focusMode')}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('focusModeDesc')}</p>
            </div>

            <div className="flex items-center gap-4">
                {classes.length > 1 && (
                    <div className="relative">
                        <select 
                            className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white py-3 pl-4 pr-10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                )}
                
                <button 
                    onClick={markRestPresent}
                    className="hidden md:block text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors"
                >
                    {t('markRestPresent')}
                </button>
            </div>
        </div>

        {/* Student Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map(student => {
                const isPresent = attendance[student.id] === 'present';
                const mealStatus = meals[student.id];
                
                return (
                    <div 
                        key={student.id} 
                        className={`
                            relative p-4 rounded-2xl border-2 transition-all duration-200
                            ${isPresent 
                                ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' 
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-75'}
                        `}
                    >
                        {/* Student Info */}
                        <div className="flex items-center gap-3 mb-4">
                            <img 
                                src={student.avatar} 
                                alt={student.name} 
                                className={`w-12 h-12 rounded-full object-cover border-2 ${isPresent ? 'border-green-400' : 'border-gray-300'}`} 
                            />
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 dark:text-white truncate text-sm">{student.name}</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{student.id}</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Attendance Toggle */}
                            <button
                                onClick={() => toggleAttendance(student.id)}
                                className={`
                                    flex flex-col items-center justify-center p-3 rounded-xl transition-all
                                    ${isPresent 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}
                                `}
                            >
                                {isPresent ? <CheckCircle size={24} /> : <X size={24} />}
                                <span className="text-[10px] font-bold mt-1 uppercase">
                                    {isPresent ? t('present') : t('absent')}
                                </span>
                            </button>

                            {/* Meal Toggle */}
                            <button
                                onClick={() => cycleMeal(student.id)}
                                disabled={!isPresent}
                                className={`
                                    flex flex-col items-center justify-center p-3 rounded-xl transition-all
                                    ${!isPresent ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400' : ''}
                                    ${isPresent && mealStatus === 'all' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : ''}
                                    ${isPresent && mealStatus === 'some' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                                    ${isPresent && mealStatus === 'none' ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                                `}
                            >
                                <Coffee size={24} />
                                <span className="text-[10px] font-bold mt-1 uppercase truncate w-full text-center">
                                    {mealStatus === 'all' ? t('ateAll') : mealStatus === 'some' ? t('ateSome') : t('ateNone')}
                                </span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Floating Save Button */}
        <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-30`}>
            <button 
                onClick={saveAll}
                className={`
                    flex items-center gap-3 px-8 py-4 rounded-full shadow-2xl font-bold text-white transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95
                    ${hasSaved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
            >
                {hasSaved ? <Check size={24} /> : <Save size={24} />}
                <span className="text-lg">{t('saveAll')}</span>
            </button>
        </div>

    </div>
  );
};

export default TeacherFocusMode;
